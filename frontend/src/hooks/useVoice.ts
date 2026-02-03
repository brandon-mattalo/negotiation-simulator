import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../services/api.service';

interface UseVoiceOptions {
  onTranscriptComplete: (transcript: string) => void;
}

function getSupportedMimeType(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return 'audio/webm';
}

export function useVoice({ onTranscriptComplete }: UseVoiceOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onCompleteRef = useRef(onTranscriptComplete);
  onCompleteRef.current = onTranscriptComplete;

  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    setInterimTranscript('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setIsListening(false);

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size < 500) return; // Too short — likely silence

        setIsProcessing(true);
        setInterimTranscript('Transcribing...');

        try {
          const text = await apiService.stt(audioBlob, mimeType);
          if (text.trim()) {
            onCompleteRef.current(text.trim());
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Transcription failed');
        } finally {
          setIsProcessing(false);
          setInterimTranscript('');
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access denied');
      } else {
        setError('Could not access microphone');
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setIsListening(false);
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }

    setIsSpeaking(true);
    setError(null);

    try {
      const audioBlob = await apiService.tts(text);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      setIsSpeaking(false);
      setError(err instanceof Error ? err.message : 'Speech synthesis failed');
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return {
    isSupported,
    isListening,
    isSpeaking,
    isProcessing,
    interimTranscript,
    error,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  };
}
