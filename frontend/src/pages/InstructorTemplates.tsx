import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Target, Clock, Thermometer, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Badge, Button, SkeletonCard } from '../components/ui';
import { useToast } from '../components/ui';
import { apiService } from '../services/api.service';
import { Template } from '../types/negotiation';

export const InstructorTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await apiService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      showToast('error', 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      const newConfig = await apiService.useTemplate(templateId);
      showToast('success', 'Template copied! Redirecting to edit...');
      navigate(`/instructor/configurations/${newConfig.id}/edit`);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to use template');
    }
  };

  return (
    <PageLayout
      title="Negotiation Templates"
      subtitle="Browse pre-built templates and customize them for your needs"
    >
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card hover padding="lg" className="h-full flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={24} className="text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-neutral-600 text-sm">{template.description}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4 flex-1">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm font-medium text-neutral-700">Strategy</span>
                    <Badge variant="primary" className="capitalize">
                      {template.configuration.botStrategy}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm font-medium text-neutral-700">Difficulty</span>
                    <Badge
                      variant={
                        template.configuration.difficulty === 'hard' ? 'danger' :
                        template.configuration.difficulty === 'medium' ? 'warning' : 'success'
                      }
                      className="capitalize"
                    >
                      {template.configuration.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-700">Time Limit</span>
                    </div>
                    <span className="text-sm text-neutral-600">
                      {template.configuration.timeLimit > 0
                        ? `${template.configuration.timeLimit} min`
                        : 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Thermometer size={16} className="text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-700">Temperament</span>
                    </div>
                    <span className="text-sm text-neutral-600">
                      {template.configuration.temperament}/10
                    </span>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-sky-50 rounded-xl border border-sky-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-sky-600" />
                    <p className="font-semibold text-sky-900 text-sm">Student Goals</p>
                  </div>
                  <ul className="space-y-1">
                    {template.configuration.studentGoals.slice(0, 3).map((goal, idx) => (
                      <li key={idx} className="text-sm text-sky-800 flex items-start gap-2">
                        <span className="text-sky-500 flex-shrink-0">•</span>
                        <span className="line-clamp-1">{goal}</span>
                      </li>
                    ))}
                    {template.configuration.studentGoals.length > 3 && (
                      <li className="text-xs text-sky-600 italic">
                        +{template.configuration.studentGoals.length - 3} more goals...
                      </li>
                    )}
                  </ul>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleUseTemplate(template.id)}
                  leftIcon={<Copy size={18} />}
                  className="w-full"
                >
                  Use This Template
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageLayout>
  );
};
