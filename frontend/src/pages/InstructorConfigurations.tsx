import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, CheckCircle, Settings as SettingsIcon, Clock, Thermometer } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConfig } from '../contexts/ConfigContext';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Badge, Button } from '../components/ui';
import { useToast } from '../components/ui';

export const InstructorConfigurations: React.FC = () => {
  const { configurations, fetchConfigurations, deleteConfig, setActiveConfig } = useConfig();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const handleSetActive = async (id: string) => {
    try {
      await setActiveConfig(id);
      showToast('success', 'Configuration set as active');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to set configuration as active');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      await deleteConfig(id);
      showToast('success', 'Configuration deleted successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete configuration');
    }
  };

  return (
    <PageLayout
      title="Configurations"
      subtitle="Manage your negotiation configurations"
      actions={
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/instructor/configurations/new')}
          leftIcon={<Plus size={20} />}
        >
          Create New
        </Button>
      }
    >
      {configurations.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-neutral-100 flex items-center justify-center">
            <SettingsIcon size={40} className="text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No Configurations Yet</h3>
          <p className="text-neutral-600 mb-6">
            Create your first configuration to get started with negotiations
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/instructor/configurations/new')}
            leftIcon={<Plus size={20} />}
          >
            Create Configuration
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {configurations.map((config, index) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card hover padding="md" className="border-2">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-neutral-900">{config.name}</h3>
                      {config.isActive && (
                        <Badge variant="success">
                          <CheckCircle size={14} className="mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-neutral-700 mb-4">{config.scenario}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="primary" className="capitalize">
                        {config.botStrategy}
                      </Badge>
                      <Badge
                        variant={
                          config.difficulty === 'hard' ? 'danger' :
                          config.difficulty === 'medium' ? 'warning' : 'success'
                        }
                        className="capitalize"
                      >
                        {config.difficulty}
                      </Badge>
                      <Badge variant="neutral">
                        <Thermometer size={14} className="mr-1" />
                        Temp: {config.temperament}/10
                      </Badge>
                      {config.timeLimit > 0 && (
                        <Badge variant="neutral">
                          <Clock size={14} className="mr-1" />
                          {config.timeLimit} min
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                    {!config.isActive && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleSetActive(config.id)}
                        leftIcon={<CheckCircle size={16} />}
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/instructor/configurations/${config.id}/edit`)}
                      leftIcon={<Edit size={16} />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(config.id)}
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
