import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hottok',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se é um webhook da Hotmart
    const hottok = req.headers.get('x-hottok');
    const hotmartSecret = Deno.env.get('HOTMART_WEBHOOK_SECRET');
    
    if (!hottok || !hotmartSecret) {
      console.error('Missing Hottok or webhook secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Ler o body do webhook
    const body = await req.text();
    const webhookData = JSON.parse(body);

    // Verificar assinatura do webhook
    const expectedSignature = createHash('sha256')
      .update(body + hotmartSecret)
      .toString();
    
    if (hottok !== expectedSignature) {
      // Log de tentativa de acesso não autorizada
      await supabase.rpc('log_security_event', {
        event_type_param: 'webhook_unauthorized',
        event_data_param: { hottok, ip: req.headers.get('cf-connecting-ip') }
      });
      
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Valid Hotmart webhook received:', webhookData.event);

    // Processar diferentes tipos de eventos
    if (webhookData.event === 'PURCHASE_COMPLETE') {
      await handlePurchaseComplete(supabase, webhookData);
    } else if (webhookData.event === 'PURCHASE_REFUNDED') {
      await handlePurchaseRefunded(supabase, webhookData);
    } else if (webhookData.event === 'SUBSCRIPTION_CANCELLATION') {
      await handleSubscriptionCancellation(supabase, webhookData);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in hotmart-webhook function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handlePurchaseComplete(supabase: any, webhookData: any) {
  const buyer = webhookData.data.buyer;
  const purchase = webhookData.data.purchase;
  
  try {
    // Buscar ou criar usuário por email
    const { data: existingUser, error: userError } = await supabase.auth.admin.getUserByEmail(buyer.email);
    
    let userId;
    if (existingUser?.user) {
      userId = existingUser.user.id;
    } else {
      // Criar usuário se não existir
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: buyer.email,
        email_confirm: true,
        user_metadata: {
          full_name: buyer.name,
          hotmart_purchase: true
        }
      });
      
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // Atualizar perfil com dados da compra
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        full_name: buyer.name,
        cpf_cnpj: buyer.doc,
        subscription_status: 'active',
        subscription_plan: purchase.product.name,
        subscription_start_date: new Date(purchase.approved_date * 1000).toISOString(),
        subscription_end_date: purchase.subscription?.end_date ? 
          new Date(purchase.subscription.end_date * 1000).toISOString() : null,
        hotmart_transaction_id: purchase.transaction,
        hotmart_webhook_data: webhookData,
        last_hotmart_update: new Date().toISOString()
      });

    if (profileError) throw profileError;

    // Log da ativação
    await supabase.rpc('log_security_event', {
      event_type_param: 'subscription_activated',
      event_data_param: { 
        user_id: userId, 
        transaction_id: purchase.transaction,
        product: purchase.product.name 
      },
      user_id_param: userId
    });

    console.log(`Subscription activated for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling purchase complete:', error);
    throw error;
  }
}

async function handlePurchaseRefunded(supabase: any, webhookData: any) {
  const purchase = webhookData.data.purchase;
  
  // Encontrar usuário pela transação
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('hotmart_transaction_id', purchase.transaction)
    .single();

  if (error || !profile) {
    console.error('Profile not found for refunded transaction:', purchase.transaction);
    return;
  }

  // Desativar assinatura
  await supabase
    .from('profiles')
    .update({
      subscription_status: 'cancelled',
      subscription_end_date: new Date().toISOString(),
      hotmart_webhook_data: webhookData,
      last_hotmart_update: new Date().toISOString()
    })
    .eq('user_id', profile.user_id);

  // Log do cancelamento
  await supabase.rpc('log_security_event', {
    event_type_param: 'subscription_refunded',
    event_data_param: { 
      user_id: profile.user_id, 
      transaction_id: purchase.transaction 
    },
    user_id_param: profile.user_id
  });

  console.log(`Subscription refunded for user ${profile.user_id}`);
}

async function handleSubscriptionCancellation(supabase: any, webhookData: any) {
  const subscription = webhookData.data.subscription;
  
  // Encontrar usuário pela transação
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('hotmart_transaction_id', subscription.transaction)
    .single();

  if (error || !profile) {
    console.error('Profile not found for cancelled subscription:', subscription.transaction);
    return;
  }

  // Cancelar assinatura
  await supabase
    .from('profiles')
    .update({
      subscription_status: 'cancelled',
      subscription_end_date: new Date(subscription.date_next_charge * 1000).toISOString(),
      hotmart_webhook_data: webhookData,
      last_hotmart_update: new Date().toISOString()
    })
    .eq('user_id', profile.user_id);

  // Log do cancelamento
  await supabase.rpc('log_security_event', {
    event_type_param: 'subscription_cancelled',
    event_data_param: { 
      user_id: profile.user_id, 
      transaction_id: subscription.transaction 
    },
    user_id_param: profile.user_id
  });

  console.log(`Subscription cancelled for user ${profile.user_id}`);
}