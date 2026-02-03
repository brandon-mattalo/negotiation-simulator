import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { Send, StopCircle, Clock, ArrowLeft, Trophy, Target, X, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoalsSidebar } from './GoalsSidebar';
import { VoiceInput } from './VoiceInput';
import { useVoice } from '../../hooks/useVoice';
import { apiService } from '../../services/api.service';
import { NegotiationConfiguration, AchievementLevel, TrophyLevel } from '../../types/negotiation';
import { Button, Card, Badge, Input } from '../ui';

export const ChatInterface: React.FC = () => {
  const { activeSession, sendMessage, endSession, cancelSession, isLoading } = useSession();
  const [message, setMessage] = useState('');
  const [showOutcome, setShowOutcome] = useState(false);
  const [configuration, setConfiguration] = useState<NegotiationConfiguration | null>(null);
  const [achievementLevels, setAchievementLevels] = useState<Map<number, { level: AchievementLevel; trophy?: TrophyLevel }>>(new Map());
  const [textareaHeight, setTextareaHeight] = useState(96); // Initial height in pixels (roughly 3 rows)
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const interruptedRef = useRef(false);
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;
  const { isSupported, isListening, isSpeaking, isProcessing, interimTranscript, error: voiceError, startListening, stopListening, speak, cancelSpeech } = useVoice({
    onTranscriptComplete: (transcript: string) => {
      const wasInterrupted = interruptedRef.current;
      interruptedRef.current = false;
      sendMessageRef.current(transcript, wasInterrupted);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  useEffect(() => {
    if (activeSession && !configuration) {
      loadConfiguration();
    }
  }, [activeSession]);

  useEffect(() => {
    if (activeSession?.outcome) {
      // Map criteria evaluation to achievement levels by index
      const levels = new Map<number, { level: AchievementLevel; trophy?: TrophyLevel }>();
      activeSession.outcome.criteriaEvaluation.forEach((ce, index) => {
        levels.set(index, {
          level: ce.achievementLevel,
          trophy: ce.trophyLevel,
        });
      });
      setAchievementLevels(levels);
    }
  }, [activeSession?.outcome]);

  useEffect(() => {
    if (!isVoiceMode || !activeSession?.messages.length) return;
    const last = activeSession.messages[activeSession.messages.length - 1];
    if (last.role === 'bot') speak(last.content);
  }, [activeSession?.messages, isVoiceMode]);

  const loadConfiguration = async () => {
    if (!activeSession) return;
    try {
      const config = await apiService.getConfiguration(activeSession.configurationId);
      setConfiguration(config);
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  if (!activeSession) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card padding="lg" className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-neutral-100 flex items-center justify-center">
            <Target size={40} className="text-neutral-400" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">No Active Session</h2>
          <p className="text-neutral-600 mb-6">
            You don't have an active negotiation session. Start one from your dashboard.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/student')}
            leftIcon={<ArrowLeft size={20} />}
          >
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    try {
      await sendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleEnd = async () => {
    if (!confirm('Are you sure you want to end this negotiation? Your performance will be evaluated.')) return;

    try {
      await endSession();
      setShowOutcome(true);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this negotiation? This session will be abandoned without evaluation.')) return;

    try {
      await cancelSession();
      navigate('/student');
    } catch (error) {
      console.error('Failed to cancel session:', error);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = textareaHeight;
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaY = resizeStartY.current - e.clientY; // Inverted because we're dragging up
      const newHeight = Math.max(60, Math.min(400, resizeStartHeight.current + deltaY));
      setTextareaHeight(newHeight);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing]);

  if (showOutcome && activeSession.outcome) {
    const outcomeColors = {
      success: { bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-700' },
      partial: { bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-700' },
      failure: { bg: 'bg-danger-50', border: 'border-danger-200', text: 'text-danger-700' },
    };
    const colors = outcomeColors[activeSession.outcome.type as keyof typeof outcomeColors] || outcomeColors.partial;

    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card padding="lg" className="mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-3xl bg-primary-100 flex items-center justify-center">
                  <Trophy size={32} className="text-primary-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-neutral-900">Session Complete!</h2>
                  <p className="text-neutral-600">Here's how you performed</p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border mb-6 ${colors.bg} ${colors.border}`}>
                <p className={`font-bold text-xl capitalize text-center ${colors.text}`}>
                  {activeSession.outcome.type}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Feedback</h3>
                <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">
                  {activeSession.outcome.feedback}
                </p>
              </div>
            </Card>

            <Card padding="lg" className="mb-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-6">Trophies Earned</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-6 bg-amber-50 rounded-2xl border border-amber-200">
                  <div className="text-5xl mb-3">🥉</div>
                  <div className="font-bold text-2xl text-amber-700 mb-1">
                    {activeSession.outcome.trophiesEarned.bronze}
                  </div>
                  <div className="text-sm text-amber-600 font-medium">Bronze</div>
                </div>
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-300">
                  <div className="text-5xl mb-3">🥈</div>
                  <div className="font-bold text-2xl text-slate-700 mb-1">
                    {activeSession.outcome.trophiesEarned.silver}
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Silver</div>
                </div>
                <div className="text-center p-6 bg-yellow-50 rounded-2xl border border-yellow-300">
                  <div className="text-5xl mb-3">🥇</div>
                  <div className="font-bold text-2xl text-yellow-700 mb-1">
                    {activeSession.outcome.trophiesEarned.gold}
                  </div>
                  <div className="text-sm text-yellow-600 font-medium">Gold</div>
                </div>
              </div>

              {activeSession.outcome.overallTrophy && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="p-6 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 rounded-3xl border-2 border-yellow-400 mb-6"
                >
                  <div className="text-center">
                    <div className="text-7xl mb-3">
                      {activeSession.outcome.overallTrophy === 'gold' ? '🥇' :
                       activeSession.outcome.overallTrophy === 'silver' ? '🥈' : '🥉'}
                    </div>
                    <p className="font-bold text-2xl text-amber-900">
                      Overall Achievement: {activeSession.outcome.overallTrophy.toUpperCase()}!
                    </p>
                  </div>
                </motion.div>
              )}

              <h3 className="text-xl font-bold text-neutral-900 mb-4">Goal Achievements</h3>
              <div className="space-y-3">
                {activeSession.outcome.criteriaEvaluation.map((criteria, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200"
                  >
                    <span className={`text-3xl flex-shrink-0 ${criteria.achieved ? '' : 'grayscale opacity-50'}`}>
                      {criteria.trophyLevel === 'gold' ? '🥇' :
                       criteria.trophyLevel === 'silver' ? '🥈' :
                       criteria.trophyLevel === 'bronze' ? '🥉' : '⚪'}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-900 mb-1">{criteria.goal}</p>
                      <Badge
                        variant={
                          criteria.achievementLevel === 'exceed' ? 'success' :
                          criteria.achievementLevel === 'achieve' ? 'primary' :
                          criteria.achievementLevel === 'close' ? 'warning' : 'danger'
                        }
                        size="sm"
                        className="mb-2"
                      >
                        {criteria.achievementLevel === 'fail' && 'Failed (0%)'}
                        {criteria.achievementLevel === 'close' && 'Close (~70%)'}
                        {criteria.achievementLevel === 'achieve' && 'Achieved (~90%)'}
                        {criteria.achievementLevel === 'exceed' && 'Exceeded (100%+)'}
                      </Badge>
                      <p className="text-sm text-neutral-600">{criteria.notes}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            <Card padding="lg" className="mb-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Bot Analysis</h3>
              <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">
                {activeSession.outcome.botAnalysis}
              </p>
            </Card>

            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/student')}
              leftIcon={<ArrowLeft size={20} />}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <div className="flex-1 flex flex-col max-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Negotiation in Progress</h2>
              {activeSession.timeRemaining !== null && activeSession.timeRemaining !== undefined && (
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={16} className="text-neutral-500" />
                  <p className="text-sm text-neutral-600">
                    Time remaining: {Math.floor(activeSession.timeRemaining / 60)}:{String(activeSession.timeRemaining % 60).padStart(2, '0')}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate('/student')}
                leftIcon={<ArrowLeft size={18} />}
              >
                Exit to Dashboard
              </Button>
              <Button
                variant="danger"
                onClick={handleCancel}
                disabled={isLoading}
                leftIcon={<X size={18} />}
              >
                Cancel Negotiation
              </Button>
              <Button
                variant="success"
                onClick={handleEnd}
                disabled={isLoading}
                leftIcon={<StopCircle size={18} />}
              >
                End Negotiation
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence initial={false}>
            {activeSession.messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`mb-4 ${msg.role === 'student' ? 'flex justify-end' : 'flex justify-start'}`}
              >
                {msg.role !== 'system' ? (
                  <div className={`max-w-lg ${msg.role === 'student' ? 'ml-auto' : 'mr-auto'}`}>
                    <div
                      className={`p-4 rounded-3xl shadow-soft ${
                        msg.role === 'student'
                          ? 'bg-primary-500 text-white'
                          : 'bg-white text-neutral-900 border border-neutral-200'
                      }`}
                    >
                      <p className="text-xs font-semibold mb-2 opacity-80">
                        {msg.role === 'student' ? 'You' : 'Bot'}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      {isVoiceMode && isSpeaking && msg.role === 'bot' && index === activeSession.messages.length - 1 && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                              <motion.div
                                key={i}
                                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                                className="w-1.5 h-1.5 rounded-full bg-neutral-400"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-neutral-500">Speaking</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex justify-center">
                    <Badge variant="neutral" className="shadow-soft">
                      {msg.content}
                    </Badge>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking bubble — shown while waiting for bot response */}
          <AnimatePresence>
            {isLoading && activeSession.messages.length > 0 && activeSession.messages[activeSession.messages.length - 1].role === 'student' && (
              <motion.div
                key="thinking-bubble"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25 }}
                className="mb-4 flex justify-start"
              >
                <div className="max-w-lg mr-auto">
                  <div className="p-4 rounded-3xl shadow-soft bg-white text-neutral-900 border border-neutral-200">
                    <p className="text-xs font-semibold mb-2 opacity-80">Bot</p>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.3, 1, 0.3],
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: 'easeInOut',
                          }}
                          className="w-2 h-2 rounded-full bg-neutral-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-neutral-200 p-4 shadow-soft">
          {isVoiceMode ? (
            <div className="max-w-5xl mx-auto">
              <VoiceInput
                isListening={isListening}
                isSpeaking={isSpeaking}
                isWaitingForResponse={isLoading}
                interimTranscript={interimTranscript}
                error={voiceError}
                isDisabled={isLoading || isProcessing}
                onMicPress={() => {
                  if (isSpeaking) {
                    cancelSpeech();
                    interruptedRef.current = true;
                    startListening();
                  } else if (isListening) {
                    stopListening();
                  } else {
                    startListening();
                  }
                }}
              />
              <div className="flex justify-center mt-1">
                <button
                  type="button"
                  onClick={() => { cancelSpeech(); stopListening(); setIsVoiceMode(false); }}
                  className="text-xs text-neutral-400 hover:text-primary-600 transition-colors"
                >
                  Switch to typing
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 items-center max-w-5xl mx-auto">
              <div className="flex-1 relative">
                {/* Resize Handle */}
                <div
                  onMouseDown={handleResizeStart}
                  className={`absolute left-0 right-0 top-0 h-2 -mt-2 flex items-center justify-center cursor-ns-resize group z-10 ${isResizing ? 'opacity-100' : 'opacity-0 hover:opacity-100'} transition-opacity`}
                >
                  <div className="w-12 h-1 bg-neutral-300 rounded-full group-hover:bg-primary-400 transition-colors" />
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your message... (Shift+Enter for new line)"
                  disabled={isLoading}
                  style={{ height: `${textareaHeight}px` }}
                  className="w-full px-6 py-3 border border-neutral-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base transition-all resize-none"
                />
              </div>
              {isSupported && (
                <button
                  type="button"
                  onClick={() => setIsVoiceMode(true)}
                  className="h-12 w-12 rounded-xl bg-neutral-100 hover:bg-primary-100 text-neutral-600 hover:text-primary-600 flex items-center justify-center shadow-soft transition-all flex-shrink-0"
                  title="Switch to voice"
                >
                  <Mic size={20} />
                </button>
              )}
              <Button
                onClick={handleSend}
                disabled={isLoading || !message.trim()}
                isLoading={isLoading}
                variant="primary"
                size="lg"
                className="px-8"
                leftIcon={<Send size={18} />}
              >
                Send
              </Button>
            </div>
          )}
        </div>
      </div>

      {configuration && (
        <GoalsSidebar
          goals={configuration.studentGoals}
          constraints={configuration.studentConstraints}
          achievementLevels={achievementLevels}
        />
      )}
    </div>
  );
};
