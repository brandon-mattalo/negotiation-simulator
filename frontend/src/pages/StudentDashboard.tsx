import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, FileText, History, ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAssignment } from '../contexts/AssignmentContext';
import { useSession } from '../contexts/SessionContext';
import { useConfig } from '../contexts/ConfigContext';
import { PageLayout } from '../components/Layout/PageLayout';
import { Button, Card, StatCard, Badge, SkeletonCard } from '../components/ui';
import { Assignment } from '../types/negotiation';
import { useToast } from '../components/ui';

export const StudentDashboard: React.FC = () => {
  const { assignments, fetchAssignments, isLoading: assignmentsLoading } = useAssignment();
  const { configurations, fetchConfigurations } = useConfig();
  const { startSession, loadActiveSession, activeSession } = useSession();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchAssignments();
    fetchConfigurations();
    loadActiveSession();
  }, []);

  useEffect(() => {
    if (activeSession) {
      navigate('/student/negotiate');
    }
  }, [activeSession, navigate]);

  const handleStartAssignment = async (assignment: Assignment) => {
    try {
      await startSession(assignment.configurationId, assignment.id);
      navigate('/student/negotiate');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to start session');
    }
  };

  const handleQuickPractice = async () => {
    const activeConfig = configurations.find(c => c.isActive);
    if (!activeConfig) {
      showToast('warning', 'No active configuration available');
      return;
    }

    try {
      await startSession(activeConfig.id);
      navigate('/student/negotiate');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to start session');
    }
  };

  const upcomingAssignments = assignments
    .filter(a => a.status === 'not_started' || a.status === 'in_progress')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const inProgressCount = assignments.filter(a => a.status === 'in_progress').length;
  const overdueCount = assignments.filter(a => a.status === 'overdue').length;

  return (
    <PageLayout
      title="Dashboard"
      subtitle="Welcome back! Here's your negotiation overview"
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Button
          variant="success"
          size="lg"
          onClick={handleQuickPractice}
          leftIcon={<Play size={20} />}
          className="h-20 text-lg"
        >
          Start Practice
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/student/assignments')}
          leftIcon={<FileText size={20} />}
          className="h-20 text-lg"
        >
          View Assignments
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => navigate('/student/history')}
          leftIcon={<History size={20} />}
          className="h-20 text-lg"
        >
          View History
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Assignments"
          value={assignments.length}
          icon={<ClipboardList size={24} />}
          color="primary"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={<CheckCircle size={24} />}
          color="mint"
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          icon={<Clock size={24} />}
          color="sky"
        />
        <StatCard
          title="Overdue"
          value={overdueCount}
          icon={<AlertCircle size={24} />}
          color="rose"
        />
      </div>

      {/* Upcoming Assignments */}
      <Card padding="lg">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Upcoming Assignments</h2>
        {assignmentsLoading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : upcomingAssignments.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-neutral-600 text-lg">No upcoming assignments</p>
            <p className="text-neutral-500 text-sm mt-2">
              Check back later or start a practice session
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingAssignments.map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card hover padding="md" className="border-2">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-neutral-900 mb-2">
                        {assignment.name}
                      </h3>
                      <p className="text-sm text-neutral-600 mb-3">
                        {assignment.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={assignment.assignmentType === 'exam' ? 'danger' : 'primary'}
                        >
                          {assignment.assignmentType}
                        </Badge>
                        {assignment.theme && (
                          <Badge variant="neutral">{assignment.theme}</Badge>
                        )}
                        <Badge variant="neutral">
                          Due: {new Date(assignment.deadline).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => handleStartAssignment(assignment)}
                      disabled={new Date() < new Date(assignment.availableFrom)}
                      leftIcon={<Play size={18} />}
                    >
                      {new Date() < new Date(assignment.availableFrom) ? 'Not Available' : 'Start'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </PageLayout>
  );
};
