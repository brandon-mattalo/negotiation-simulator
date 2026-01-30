import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Handshake, FileText, Bot, MessageSquare, Sparkles } from 'lucide-react';

const loadingSteps = [
  { icon: FileText, text: 'Loading scenario...', color: 'text-sky-600' },
  { icon: Handshake, text: 'Preparing negotiation table...', color: 'text-primary-600' },
  { icon: Bot, text: 'Bot is reviewing their strategy...', color: 'text-warning-600' },
  { icon: MessageSquare, text: 'Starting negotiation...', color: 'text-mint-600' },
];

const negotiationTips = [
  'Listen actively to understand their position',
  'Focus on interests, not positions',
  'Look for win-win solutions',
  'Stay calm and professional',
  'Ask clarifying questions',
  'Be prepared to compromise',
  'Build rapport first',
  'Know your BATNA (Best Alternative)',
];

export const NegotiationLoadingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 2000);

    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % negotiationTips.length);
    }, 4000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(tipInterval);
    };
  }, []);

  const CurrentIcon = loadingSteps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-50 via-sky-50 to-lavender-50">
      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Main animated icon */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
            className="mb-8 flex justify-center"
          >
            <div className="relative">
              {/* Pulsing background */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`absolute inset-0 rounded-full bg-current ${loadingSteps[currentStep].color} blur-2xl`}
              />

              {/* Icon container */}
              <div className="relative w-32 h-32 rounded-full bg-white shadow-soft-lg flex items-center justify-center">
                <CurrentIcon
                  size={64}
                  className={loadingSteps[currentStep].color}
                  strokeWidth={1.5}
                />
              </div>

              {/* Sparkles */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles size={24} className="text-yellow-500" />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Loading text */}
        <AnimatePresence mode="wait">
          <motion.h2
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-bold text-neutral-900 mb-4"
          >
            {loadingSteps[currentStep].text}
          </motion.h2>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-12">
          {loadingSteps.map((_, index) => (
            <motion.div
              key={index}
              animate={{
                scale: index === currentStep ? 1.2 : 1,
                backgroundColor:
                  index === currentStep
                    ? 'rgb(99, 102, 241)'
                    : 'rgb(229, 231, 235)',
              }}
              transition={{ duration: 0.3 }}
              className="w-2 h-2 rounded-full"
            />
          ))}
        </div>

        {/* Negotiation tips */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft border border-neutral-200/50">
          <div className="flex items-center gap-2 mb-3 justify-center">
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-600">💡</span>
            </div>
            <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
              Negotiation Tip
            </h3>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={currentTip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-lg text-neutral-900 font-medium"
            >
              {negotiationTips[currentTip]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Animated dots at bottom */}
        <motion.div
          className="mt-8 flex justify-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
              className="w-2 h-2 rounded-full bg-primary-500"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};
