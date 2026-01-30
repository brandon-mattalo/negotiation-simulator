import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAssignment } from '../contexts/AssignmentContext';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Badge, Button } from '../components/ui';
import { useToast } from '../components/ui';

export const InstructorAssignments: React.FC = () => {
  const { assignments, fetchAssignments, deleteAssignment } = useAssignment();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await deleteAssignment(id);
      showToast('success', 'Assignment deleted successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete assignment');
    }
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
      title="Assignments"
      subtitle="Manage student assignments"
      actions={
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/instructor/assignments/new')}
          leftIcon={<Plus size={20} />}
        >
          Create New
        </Button>
      }
    >
      {assignments.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-neutral-100 flex items-center justify-center">
            <ClipboardList size={40} className="text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No Assignments Yet</h3>
          <p className="text-neutral-600 mb-6">
            Create your first assignment to give students practice scenarios
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/instructor/assignments/new')}
            leftIcon={<Plus size={20} />}
          >
            Create Assignment
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
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <h3 className="text-xl font-bold text-neutral-900">
                        {assignment.name}
                      </h3>
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
                    <p className="text-neutral-700 mb-3">{assignment.description}</p>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Calendar size={16} className="text-neutral-400" />
                      <span>Deadline: {new Date(assignment.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/instructor/assignments/${assignment.id}/edit`)}
                      leftIcon={<Edit size={16} />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(assignment.id)}
                      leftIcon={<Trash2 size={16} />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageLayout>
  );
};
