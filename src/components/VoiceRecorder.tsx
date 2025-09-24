import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceRecorder({ onTranscription, disabled, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "Gravação iniciada",
        description: "Fale sua resposta agora",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erro ao acessar microfone",
        description: "Verifique as permissões de áudio",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  }, [isRecording]);

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 0x8000; // 32KB chunks

      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }

      const base64Audio = btoa(binary);

      // Send to transcription service
      const { data, error } = await supabase.functions.invoke('voice-transcription', {
        body: { audio: base64Audio }
      });

      if (error) {
        throw new Error(error.message || 'Erro na transcrição');
      }

      if (data?.text) {
        onTranscription(data.text);
        toast({
          title: "Transcrição concluída",
          description: "Texto convertido com sucesso",
        });
      } else {
        throw new Error('Não foi possível transcrever o áudio');
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Erro na transcrição",
        description: "Tente gravar novamente",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      variant={isRecording ? "destructive" : "outline"}
      size="sm"
      onClick={handleToggleRecording}
      disabled={disabled || isProcessing}
      className={className}
    >
      {isProcessing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          Processando...
        </>
      ) : isRecording ? (
        <>
          <Square className="h-4 w-4 mr-2" />
          Parar
        </>
      ) : (
        <>
          <Mic className="h-4 w-4 mr-2" />
          Gravar
        </>
      )}
    </Button>
  );
}