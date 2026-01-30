import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, MessageSquare, Calendar, Clock, History as HistoryIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession } from '../contexts/SessionContext';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Badge, Button } from '../components/ui';

export const StudentHistory: React.FC = () => {
  const { sessionHistory, loadSessionHistory } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    loadSessionHistory();
  }, []);

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
      title="Session History"
      subtitle="Review your past negotiation sessions"
    >
      {sessionHistory.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-neutral-100 flex items-center justify-center">
            <HistoryIcon size={40} className="text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No Sessions Yet</h3>
          <p className="text-neutral-600 mb-6">
            You haven't completed any negotiation sessions. Start your first one!
          </p>
          <Button variant="primary" onClick={() => navigate('/student')}>
            Go to Dashboard
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessionHistory.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card hover padding="md" className="border-2">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
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

                    <div className="space-y-2 mb-3">
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

                    {session.outcome && (
                      <p className="text-sm text-neutral-700 line-clamp-2">
                        {session.outcome.feedback}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => navigate(`/student/history/${session.id}`)}
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
