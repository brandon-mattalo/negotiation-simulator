import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceOptions {
  onTranscriptComplete: (transcript: string) => void;
}

const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || '21m00Tjm1fdNe8A04EOrtEArX';

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
    if (!API_KEY) {
      setError('Add VITE_ELEVENLABS_API_KEY to your .env file');
      return;
    }
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
          const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'webm';
          const formData = new FormData();
          formData.append('file', audioBlob, `recording.${ext}`);
          formData.append('model_id', 'scribe_v1');
          formData.append('language', 'en');

          const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: { 'xi-api-key': API_KEY },
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Transcription failed (${response.status})`);
          }

          const result = await response.json();
          if (result.text?.trim()) {
            onCompleteRef.current(result.text.trim());
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
    if (!API_KEY) {
      setError('Add VITE_ELEVENLABS_API_KEY to your .env file');
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }

    setIsSpeaking(true);
    setError(null);

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });

      if (!response.ok) {
        throw new Error(`Speech synthesis failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
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
