import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hottok',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const hotmartSecret = Deno.env.get('HOTMART_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!hotmartSecret) {
      throw new Error('HOTMART_WEBHOOK_SECRET não configurado');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar assinatura do webhook
    const hottok = req.headers.get('x-hottok');
    const body = await req.text();
    
    if (!hottok) {
      console.log('Webhook rejeitado: sem x-hottok header');
      return new Response('Unauthorized', { status: 401 });
    }

    // Validar assinatura HMAC
    const expectedSignature = await createHmac("sha256", new TextEncoder().encode(hotmartSecret))
      .update(new TextEncoder().encode(body))
      .digest();
    
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (hottok !== expectedHex) {
      console.log('Webhook rejeitado: assinatura inválida');
      return new Response('Unauthorized', { status: 401 });
    }

    const webhookData = JSON.parse(body);
    console.log('Webhook válido recebido:', webhookData.event);

    // Log de segurança
    await supabase.rpc('log_security_event', {
      event_type_param: 'hotmart_webhook_received',
      event_data_param: { event: webhookData.event, transaction_id: webhookData.data?.transaction },
      user_id_param: null
    });

    // Processar diferentes tipos de evento
    switch (webhookData.event) {
      case 'PURCHASE_COMPLETE':
      case 'PURCHASE_APPROVED':
        await handlePurchaseComplete(supabase, webhookData);
        break;
      
      case 'PURCHASE_REFUNDED':
      case 'PURCHASE_CANCELED':
        await handlePurchaseCanceled(supabase, webhookData);
        break;
      
      default:
        console.log('Evento não processado:', webhookData.event);
    }

    return new Response(
      JSON.stringify({ status: 'success', event: webhookData.event }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no webhook Hotmart:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handlePurchaseComplete(supabase: any, webhookData: any) {
  const { buyer, transaction, product } = webhookData.data;
  
  try {
    // Procurar usuário pelo email
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('cpf_cnpj', buyer.email) // Temporário até termos CPF
      .single();

    let userId = null;

    if (profileError) {
      // Criar novo usuário se não existir
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: buyer.email,
        email_confirm: true,
        user_metadata: {
          full_name: buyer.name
        }
      });

      if (authError) throw authError;
      userId = authData.user.id;
    } else {
      userId = profileData.user_id;
    }

    // Atualizar perfil com dados da compra
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1); // 1 ano de acesso

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: product.name,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: subscriptionEndDate.toISOString(),
        hotmart_transaction_id: transaction,
        hotmart_webhook_data: webhookData,
        last_hotmart_update: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    console.log('Usuário ativado com sucesso:', buyer.email);

  } catch (error) {
    console.error('Erro ao processar compra:', error);
    throw error;
  }
}

async function handlePurchaseCanceled(supabase: any, webhookData: any) {
  const { transaction } = webhookData.data;
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        subscription_end_date: new Date().toISOString(),
        last_hotmart_update: new Date().toISOString()
      })
      .eq('hotmart_transaction_id', transaction);

    if (error) throw error;

    console.log('Assinatura cancelada:', transaction);

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    throw error;
  }
}