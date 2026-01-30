import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Calendar, Clock, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAssignment } from '../contexts/AssignmentContext';
import { useSession } from '../contexts/SessionContext';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Badge, Button } from '../components/ui';
import { Assignment } from '../types/negotiation';
import { useToast } from '../components/ui';

export const StudentAssignments: React.FC = () => {
  const { assignments, fetchAssignments } = useAssignment();
  const { startSession } = useSession();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleStartAssignment = async (assignment: Assignment) => {
    try {
      await startSession(assignment.configurationId, assignment.id);
      navigate('/student/negotiate');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to start session');
    }
  };

  const isAvailable = (assignment: Assignment) => {
    const now = new Date();
    return now >= new Date(assignment.availableFrom) && now <= new Date(assignment.availableUntil);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'overdue': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <PageLayout
      title="My Assignments"
      subtitle="View and start your negotiation assignments"
    >
      {assignments.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-neutral-100 flex items-center justify-center">
            <FileText size={40} className="text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No Assignments Yet</h3>
          <p className="text-neutral-600 mb-6">
            Your instructor hasn't created any assignments yet. Check back later!
          </p>
          <Button variant="primary" onClick={() => navigate('/student')}>
            Back to Dashboard
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card hover padding="md" className="border-2">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-neutral-900 mb-3">
                      {assignment.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant={assignment.assignmentType === 'exam' ? 'danger' : 'primary'}>
                        {assignment.assignmentType}
                      </Badge>
                      {assignment.theme && (
                        <Badge variant="neutral">{assignment.theme}</Badge>
                      )}
                      {assignment.status && (
                        <Badge variant={getStatusVariant(assignment.status)}>
                          {assignment.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-neutral-700 mb-4">{assignment.description}</p>
                    <div className="space-y-2 text-sm text-neutral-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-neutral-400" />
                        <span>
                          Available: {new Date(assignment.availableFrom).toLocaleDateString()} - {new Date(assignment.availableUntil).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-neutral-400" />
                        <span>
                          Deadline: {new Date(assignment.deadline).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={assignment.status === 'completed' ? 'secondary' : 'primary'}
                    onClick={() => handleStartAssignment(assignment)}
                    disabled={!isAvailable(assignment) || assignment.status === 'completed'}
                    leftIcon={<Play size={18} />}
                    className="md:self-start"
                  >
                    {assignment.status === 'completed'
                      ? 'Completed'
                      : !isAvailable(assignment)
                      ? 'Not Available'
                      : 'Start'}
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
