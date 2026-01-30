import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Badge, Button, SkeletonCard } from '../components/ui';
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
                    <Badge variant="neutral" className="shadow-soft">
                      {msg.content}
                    </Badge>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Outcome */}
        {session.outcome && (
          <>
            <Card padding="lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-3xl bg-primary-100 flex items-center justify-center">
                  <Trophy size={32} className="text-primary-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-neutral-900">Evaluation Results</h2>
                  <Badge variant={getOutcomeVariant(session.outcome.type)} size="lg" className="mt-2">
                    {session.outcome.type}
                  </Badge>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Feedback</h3>
                <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">
                  {session.outcome.feedback}
                </p>
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-xl font-bold text-neutral-900 mb-6">Trophies Earned</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-6 bg-amber-50 rounded-2xl border border-amber-200">
                  <div className="text-5xl mb-3">🥉</div>
                  <div className="font-bold text-2xl text-amber-700 mb-1">
                    {session.outcome.trophiesEarned.bronze}
                  </div>
                  <div className="text-sm text-amber-600 font-medium">Bronze</div>
                </div>
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-300">
                  <div className="text-5xl mb-3">🥈</div>
                  <div className="font-bold text-2xl text-slate-700 mb-1">
                    {session.outcome.trophiesEarned.silver}
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Silver</div>
                </div>
                <div className="text-center p-6 bg-yellow-50 rounded-2xl border border-yellow-300">
                  <div className="text-5xl mb-3">🥇</div>
                  <div className="font-bold text-2xl text-yellow-700 mb-1">
                    {session.outcome.trophiesEarned.gold}
                  </div>
                  <div className="text-sm text-yellow-600 font-medium">Gold</div>
                </div>
              </div>

              {session.outcome.overallTrophy && (
                <div className="p-6 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 rounded-3xl border-2 border-yellow-400 mb-6">
                  <div className="text-center">
                    <div className="text-7xl mb-3">
                      {session.outcome.overallTrophy === 'gold' ? '🥇' :
                       session.outcome.overallTrophy === 'silver' ? '🥈' : '🥉'}
                    </div>
                    <p className="font-bold text-2xl text-amber-900">
                      Overall Achievement: {session.outcome.overallTrophy.toUpperCase()}!
                    </p>
                  </div>
                </div>
              )}

              <h3 className="text-xl font-bold text-neutral-900 mb-4">Goal Achievements</h3>
              <div className="space-y-3">
                {session.outcome.criteriaEvaluation.map((criteria, idx) => (
                  <div
                    key={idx}
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
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Bot Analysis</h3>
              <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">
                {session.outcome.botAnalysis}
              </p>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
};
