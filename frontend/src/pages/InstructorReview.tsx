import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, MessageSquare, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Badge, Button, SkeletonCard } from '../components/ui';
import { apiService } from '../services/api.service';
import { NegotiationSession } from '../types/negotiation';

export const InstructorReview: React.FC = () => {
  const [sessions, setSessions] = useState<NegotiationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await apiService.getStudentSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      title="Student Session Review"
      subtitle="Review and analyze student negotiation sessions"
    >
      {isLoading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : sessions.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-neutral-100 flex items-center justify-center">
            <Eye size={40} className="text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No Sessions Yet</h3>
          <p className="text-neutral-600">
            Student sessions will appear here once they complete negotiations
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card hover padding="md" className="border-2">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-lg font-bold text-neutral-900">
                        Session #{session.id.slice(0, 8)}
                      </h3>
                      {session.outcome && (
                        <Badge variant={getOutcomeVariant(session.outcome.type)}>
                          {session.outcome.type}
                        </Badge>
                      )}
                      {session.isActive && (
                        <Badge variant="primary">Active</Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Calendar size={16} className="text-neutral-400" />
                        <span>Started: {new Date(session.startTime).toLocaleString()}</span>
                      </div>
                      {session.endTime && (
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Clock size={16} className="text-neutral-400" />
                          <span>Ended: {new Date(session.endTime).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <MessageSquare size={16} className="text-neutral-400" />
                        <span>{session.messages.length} messages</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => navigate(`/instructor/review/${session.id}`)}
                    leftIcon={<Eye size={18} />}
                    className="md:self-start"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageLayout>
  );
};
