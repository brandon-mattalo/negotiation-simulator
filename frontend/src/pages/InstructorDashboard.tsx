import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ClipboardList, Eye, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';
import { useAssignment } from '../contexts/AssignmentContext';
import { PageLayout } from '../components/Layout/PageLayout';
import { StatCard, Card, Button } from '../components/ui';

export const InstructorDashboard: React.FC = () => {
  const { configurations, fetchConfigurations } = useConfig();
  const { assignments, fetchAssignments } = useAssignment();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConfigurations();
    fetchAssignments();
  }, []);

  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const inProgressCount = assignments.filter(a => a.status === 'in_progress').length;
  const overdueCount = assignments.filter(a => a.status === 'overdue').length;
  const activeCount = assignments.filter(a => a.status !== 'completed').length;

  return (
    <PageLayout
      title="Dashboard"
      subtitle="Manage your negotiation configurations and assignments"
    >
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Configurations"
          value={configurations.length}
          icon={<Settings size={24} />}
          color="primary"
        />
        <StatCard
          title="Total Assignments"
          value={assignments.length}
          icon={<ClipboardList size={24} />}
          color="sky"
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={<Clock size={24} />}
          color="lavender"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={<CheckCircle size={24} />}
          color="mint"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card padding="lg">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/instructor/configurations/new')}
              leftIcon={<Plus size={20} />}
              className="w-full"
            >
              Create New Configuration
            </Button>
            <Button
              variant="success"
              size="lg"
              onClick={() => navigate('/instructor/assignments/new')}
              leftIcon={<Plus size={20} />}
              className="w-full"
            >
              Create New Assignment
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/instructor/review')}
              leftIcon={<Eye size={20} />}
              className="w-full"
            >
              Review Student Sessions
            </Button>
          </div>
        </Card>

        {/* Activity Summary */}
        <Card padding="lg">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Activity Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-mint-50 rounded-2xl border border-mint-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-mint-100 flex items-center justify-center text-mint-600">
                  <CheckCircle size={20} />
                </div>
                <span className="font-medium text-neutral-900">Completed</span>
              </div>
              <span className="text-2xl font-bold text-mint-600">{completedCount}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-sky-50 rounded-2xl border border-sky-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                  <Clock size={20} />
                </div>
                <span className="font-medium text-neutral-900">In Progress</span>
              </div>
              <span className="text-2xl font-bold text-sky-600">{inProgressCount}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                  <AlertCircle size={20} />
                </div>
                <span className="font-medium text-neutral-900">Overdue</span>
              </div>
              <span className="text-2xl font-bold text-rose-600">{overdueCount}</span>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};
