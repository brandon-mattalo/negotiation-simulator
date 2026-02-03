import React, { createContext, useContext, useState, ReactNode } from 'react';
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
      const { message: userMessage, botResponse } = await apiService.sendMessage(
        activeSession.id,
        message,
        interruptedBot
      );

      // Replace optimistic message with server-confirmed one, append bot response
      setActiveSession(prev => {
        if (!prev) return prev;
        const messages = prev.messages.filter(m => m.id !== optimisticId);
        return { ...prev, messages: [...messages, userMessage, botResponse] };
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
