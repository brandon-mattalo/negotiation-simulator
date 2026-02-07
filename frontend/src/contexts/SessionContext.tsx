import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { NegotiationSession, SessionOutcome, Message } from '../types/negotiation';
import { apiService } from '../services/api.service';

interface SessionContextValue {
  activeSession: NegotiationSession | null;
  sessionHistory: NegotiationSession[];
  startSession: (configId: string, assignmentId?: string) => Promise<void>;
  sendMessage: (message: string, interruptedBot?: boolean) => Promise<void>;
  endSession: () => Promise<SessionOutcome>;
  cancelSession: () => Promise<void>;
  loadActiveSession: () => Promise<void>;
  loadSessionHistory: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<NegotiationSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<NegotiationSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const startSession = async (configId: string, assignmentId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await apiService.startSession(configId, assignmentId);
      setActiveSession(session);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: string, interruptedBot?: boolean) => {
    if (!activeSession) {
      throw new Error('No active session');
    }

    // Optimistic update: show user message immediately so the thinking bubble
    // appears after it rather than floating above the last bot message.
    const optimisticId = 'optimistic-' + Date.now();
    const optimisticMessage: Message = {
      id: optimisticId,
      role: 'student',
      content: message,
      timestamp: new Date(),
    };

    setActiveSession(prev => {
      if (!prev) return prev;
      return { ...prev, messages: [...prev.messages, optimisticMessage] };
    });

    setIsLoading(true);
    setError(null);
    try {
      const { message: userMessage, botResponse, interruptionMessage } = await apiService.sendMessage(
        activeSession.id,
        message,
        interruptedBot
      );

      // Replace optimistic message with server-confirmed one, append interruption (if any), then bot response
      setActiveSession(prev => {
        if (!prev) return prev;
        const messages = prev.messages.filter(m => m.id !== optimisticId);
        const newMessages = interruptionMessage
          ? [...messages, interruptionMessage, userMessage, botResponse]
          : [...messages, userMessage, botResponse];
        return { ...prev, messages: newMessages };
      });
    } catch (err: any) {
      // Roll back optimistic message on failure
      setActiveSession(prev => {
        if (!prev) return prev;
        return { ...prev, messages: prev.messages.filter(m => m.id !== optimisticId) };
      });
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async (): Promise<SessionOutcome> => {
    if (!activeSession) {
      throw new Error('No active session');
    }

    setIsLoading(true);
    setError(null);
    try {
      const outcome = await apiService.endSession(activeSession.id);
      setActiveSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          isActive: false,
          endTime: new Date(),
          outcome,
        };
      });
      return outcome;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSession = async (): Promise<void> => {
    if (!activeSession) {
      throw new Error('No active session');
    }

    setIsLoading(true);
    setError(null);
    try {
      await apiService.cancelSession(activeSession.id);
      setActiveSession(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveSession = async () => {
    setIsLoading(true);
    try {
      const session = await apiService.getActiveSession();
      setActiveSession(session);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionHistory = async () => {
    setIsLoading(true);
    try {
      const sessions = await apiService.getSessionHistory();
      setSessionHistory(sessions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side timer countdown
  useEffect(() => {
    if (activeSession?.isActive && activeSession.timeRemaining !== null && activeSession.timeRemaining !== undefined) {
      // Clear any existing timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      // Start countdown timer
      timerIntervalRef.current = setInterval(() => {
        setActiveSession(prev => {
          if (!prev || !prev.isActive || prev.timeRemaining === null || prev.timeRemaining === undefined) {
            return prev;
          }

          const newTimeRemaining = Math.max(0, prev.timeRemaining - 1);

          // Auto-end session when time runs out
          if (newTimeRemaining === 0) {
            endSession().catch(console.error);
          }

          return {
            ...prev,
            timeRemaining: newTimeRemaining,
          };
        });
      }, 1000);

      // Sync with server every 30 seconds to prevent drift
      const syncInterval = setInterval(async () => {
        if (activeSession?.id && activeSession.isActive) {
          try {
            const session = await apiService.getActiveSession();
            if (session && session.timeRemaining !== null && session.timeRemaining !== undefined) {
              setActiveSession(prev => {
                if (!prev) return prev;
                return { ...prev, timeRemaining: session.timeRemaining };
              });
            }
          } catch (err) {
            console.error('Failed to sync timer:', err);
          }
        }
      }, 30000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        clearInterval(syncInterval);
      };
    } else {
      // No timer needed, clear if exists
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [activeSession?.id, activeSession?.isActive]);

  return (
    <SessionContext.Provider
      value={{
        activeSession,
        sessionHistory,
        startSession,
        sendMessage,
        endSession,
        cancelSession,
        loadActiveSession,
        loadSessionHistory,
        isLoading,
        error,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};
