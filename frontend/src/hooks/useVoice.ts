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

function getSpeechRecognitionClass(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function useVoice({ onTranscriptComplete }: UseVoiceOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Web Speech API refs
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const manualStopRef = useRef(false);
  // Set to true when onerror triggers a MediaRecorder fallback; prevents the
  // subsequent onend from resetting isListening before the fallback starts.
  const fallingBackRef = useRef(false);

  // Fallback MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // TTS playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const onCompleteRef = useRef(onTranscriptComplete);
  onCompleteRef.current = onTranscriptComplete;

  const SpeechRecognitionClass = getSpeechRecognitionClass();
  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
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
    transcriptRef.current = '';
    manualStopRef.current = false;
    fallingBackRef.current = false;

    // MediaRecorder → ElevenLabs Scribe path.  Used as the primary path when
    // Web Speech API is unavailable, or as an automatic fallback when it errors.
    const startMediaRecorderFallback = async () => {
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
        setIsListening(false);
      }
    };

    if (SpeechRecognitionClass) {
      // Primary path: browser Web Speech API (real-time, no network round-trip)
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let final = '';
        let interim = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        transcriptRef.current = final + interim;
        setInterimTranscript(final + interim);
      };

      recognition.onerror = (event: any) => {
        // We called .abort() ourselves — ignore.
        if (event.error === 'aborted') return;

        recognitionRef.current = null;

        // No speech detected within the timeout window — not a real error.
        // Just stop cleanly; the user can tap mic again.
        if (event.error === 'no-speech') {
          setIsListening(false);
          setInterimTranscript('');
          transcriptRef.current = '';
          return;
        }

        // Network / service errors: silently fall back to MediaRecorder + ElevenLabs.
        // Chrome's Web Speech requires Google's servers, so this fires whenever
        // the connection drops or the service is temporarily unavailable.
        if (event.error === 'network' || event.error === 'service-not-available') {
          fallingBackRef.current = true;
          setInterimTranscript('');
          transcriptRef.current = '';
          startMediaRecorderFallback();
          return;
        }

        // Remaining errors are genuine — surface a descriptive message.
        setIsListening(false);
        const messages: Record<string, string> = {
          'not-allowed': 'Microphone access denied',
          'audio-capture': 'No microphone found',
        };
        setError(messages[event.error] || `Speech error: ${event.error}`);
      };

      recognition.onend = () => {
        recognitionRef.current = null;

        // If onerror already kicked off the MediaRecorder fallback, don't
        // touch isListening — the fallback will manage it.
        if (fallingBackRef.current) {
          fallingBackRef.current = false;
          return;
        }

        setIsListening(false);

        if (manualStopRef.current) {
          // User pressed mic to stop — send accumulated transcript
          manualStopRef.current = false;
          const text = transcriptRef.current.trim();
          setInterimTranscript('');
          transcriptRef.current = '';
          if (text) {
            onCompleteRef.current(text);
          }
        }
        // If recognition auto-ended (e.g. silence timeout), just stop.
        // Transcript remains visible; user presses mic again to continue.
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } else {
      // No Web Speech API available — go straight to MediaRecorder fallback
      await startMediaRecorderFallback();
    }
  }, [SpeechRecognitionClass]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      manualStopRef.current = true;
      recognitionRef.current.stop();
      // onend handler fires after final results are processed, then sends transcript
    } else if (mediaRecorderRef.current?.state === 'recording') {
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
