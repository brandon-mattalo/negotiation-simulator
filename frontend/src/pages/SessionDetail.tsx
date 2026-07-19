import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Trophy, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Badge, Button, SkeletonCard } from '../components/ui';
import { FeedbackResults } from '../components/Student/FeedbackResults';
import { apiService } from '../services/api.service';
import { NegotiationSession } from '../types/negotiation';
import { useAuth } from '../contexts/AuthContext';

export const SessionDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<NegotiationSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    if (!id) return;
    try {
      const data = await apiService.getSession(id);
      setSession(data);
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const backPath = user?.role === 'instructor' ? '/instructor/review' : '/student/history';

  if (isLoading) {
    return (
      <PageLayout title="Session Details" subtitle="Loading session information...">
        <SkeletonCard />
        <SkeletonCard />
      </PageLayout>
    );
  }

  if (!session) {
    return (
      <PageLayout title="Session Not Found">
        <Card padding="lg" className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-neutral-100 flex items-center justify-center">
            <MessageSquare size={40} className="text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">Session Not Found</h3>
          <p className="text-neutral-600 mb-6">
            The session you're looking for doesn't exist or has been removed.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate(backPath)}
            leftIcon={<ArrowLeft size={18} />}
          >
            Go Back
          </Button>
        </Card>
      </PageLayout>
    );
  }

  const getOutcomeVariant = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'partial': return 'warning';
      case 'failure': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <PageLayout
      title="Session Details"
      subtitle={`Started: ${new Date(session.startTime).toLocaleString()}${session.endTime ? ` • Ended: ${new Date(session.endTime).toLocaleString()}` : ''}`}
      actions={
        <Button
          variant="secondary"
          onClick={() => navigate(backPath)}
          leftIcon={<ArrowLeft size={18} />}
        >
          Back to {user?.role === 'instructor' ? 'Review' : 'History'}
        </Button>
      }
    >
      <div className="space-y-6">

        {/* Transcript */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <MessageSquare size={20} className="text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">Conversation Transcript</h2>
          </div>
          <div className="space-y-4 bg-neutral-50 rounded-2xl p-4">
            {session.messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
              >
                {msg.role !== 'system' ? (
                  <div className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-2xl rounded-3xl p-4 shadow-soft ${
                        msg.role === 'student'
                          ? 'bg-primary-500 text-white'
                          : 'bg-white text-neutral-900 border border-neutral-200'
                      }`}
                    >
                      <p className="font-semibold text-xs mb-2 opacity-80">
                        {msg.role === 'student' ? 'Student' : 'Bot'}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className="text-xs mt-2 opacity-75">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    {msg.content.includes('[Student interrupted') ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-warning-50 border border-warning-300 rounded-full shadow-soft">
                        <AlertCircle size={16} className="text-warning-600" />
                        <span className="text-sm font-medium text-warning-700">
                          Student interrupted the bot
                        </span>
                      </div>
                    ) : (
                      <Badge variant="neutral" className="shadow-soft">
                        {msg.content}
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Outcome */}
        {session.outcome && (
          <>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-primary-100 flex items-center justify-center">
                <Trophy size={28} className="text-primary-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-neutral-900">Evaluation Results</h2>
                <Badge variant={getOutcomeVariant(session.outcome.type)} size="lg" className="mt-2">
                  {session.outcome.type}
                </Badge>
              </div>
            </div>

            <FeedbackResults outcome={session.outcome} />
          </>
        )}
      </div>
    </PageLayout>
  );
};
