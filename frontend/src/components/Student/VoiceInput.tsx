import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceInputProps {
  isListening: boolean;
  isSpeaking: boolean;
  isWaitingForResponse: boolean;
  interimTranscript: string;
  error: string | null;
  isDisabled: boolean;
  onMicPress: () => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  isListening,
  isSpeaking,
  isWaitingForResponse,
  interimTranscript,
  error,
  isDisabled,
  onMicPress,
}) => {
  const bgColor = isListening
    ? 'bg-danger-500 hover:bg-danger-600'
    : isSpeaking
      ? 'bg-warning-500 hover:bg-warning-600'
      : 'bg-primary-500 hover:bg-primary-600';

  const statusText = error
    ? error
    : isWaitingForResponse
      ? 'Preparing response...'
      : isListening
        ? 'Recording... tap to stop'
        : isSpeaking
          ? 'Bot is speaking... (tap to interrupt)'
          : 'Tap to speak';

  const statusColor = error
    ? 'text-danger-600'
    : isWaitingForResponse
      ? 'text-primary-600'
      : isListening
        ? 'text-danger-600'
        : isSpeaking
          ? 'text-warning-600'
          : 'text-neutral-500';

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      {/* Mic button with pulsing rings */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing rings — only when listening */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                key="ring1"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-danger-400"
              />
              <motion.div
                key="ring2"
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-danger-300"
              />
            </>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={onMicPress}
          disabled={isDisabled}
          whileTap={isDisabled ? {} : { scale: 0.92 }}
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-soft-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${bgColor}`}
        >
          {isListening ? <MicOff size={32} /> : <Mic size={32} />}
        </motion.button>
      </div>

      {/* Status text */}
      <p className={`text-sm font-medium ${statusColor}`}>{statusText}</p>

      {/* Interim transcript bubble */}
      <AnimatePresence>
        {interimTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="bg-neutral-100 rounded-2xl px-4 py-2 max-w-sm text-center"
          >
            <p className="text-sm text-neutral-700 italic">{interimTranscript}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
