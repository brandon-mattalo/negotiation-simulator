import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, Search, Scale, Award, Sparkles } from 'lucide-react';

// Shown full-screen while the student's completed negotiation is being
// evaluated by the AI. Evaluation takes several seconds, so this screen makes
// it obvious that work is happening and roughly how far along it is.
const evaluationSteps = [
  { icon: Search, text: 'Reviewing your conversation...', color: 'text-sky-600' },
  { icon: ClipboardCheck, text: 'Analyzing your negotiation moves...', color: 'text-primary-600' },
  { icon: Scale, text: 'Scoring against the rubric...', color: 'text-warning-600' },
  { icon: Award, text: 'Preparing your feedback...', color: 'text-mint-600' },
];

export const EvaluationLoadingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % evaluationSteps.length);
    }, 2600);

    // Indeterminate progress: ease toward ~95% so it always feels like it is
    // advancing, but never hits 100% until the real results actually arrive
    // (this component unmounts at that point).
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? prev : prev + (95 - prev) * 0.06));
    }, 200);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const CurrentIcon = evaluationSteps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-50 via-sky-50 to-lavender-50 px-6">
      <div className="max-w-2xl w-full mx-auto text-center">
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
                className={`absolute inset-0 rounded-full bg-current ${evaluationSteps[currentStep].color} blur-2xl`}
              />

              {/* Icon container */}
              <div className="relative w-32 h-32 rounded-full bg-white shadow-soft-lg flex items-center justify-center">
                <CurrentIcon
                  size={64}
                  className={evaluationSteps[currentStep].color}
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

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
          Evaluating your negotiation
        </h2>

        {/* Current step text */}
        <div className="h-8 mb-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="text-base sm:text-lg text-neutral-600"
            >
              {evaluationSteps[currentStep].text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="max-w-md mx-auto">
          <div className="h-2.5 w-full rounded-full bg-white/70 overflow-hidden shadow-inner">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-sky-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Step indicator dots */}
          <div className="flex justify-center gap-2 mt-6">
            {evaluationSteps.map((_, index) => (
              <motion.div
                key={index}
                animate={{
                  scale: index === currentStep ? 1.3 : 1,
                  backgroundColor:
                    index <= currentStep
                      ? 'rgb(99, 102, 241)'
                      : 'rgb(226, 232, 240)',
                }}
                transition={{ duration: 0.3 }}
                className="w-2.5 h-2.5 rounded-full"
              />
            ))}
          </div>
        </div>

        <p className="text-sm text-neutral-500 mt-10">
          This usually takes a few moments. Please keep this page open.
        </p>
      </div>
    </div>
  );
};
