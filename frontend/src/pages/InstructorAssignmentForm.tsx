import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Users } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';
import { useAssignment } from '../contexts/AssignmentContext';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Input, Textarea, Button } from '../components/ui';
import { useToast } from '../components/ui';
import { AssignmentType } from '../types/negotiation';
import { apiService } from '../services/api.service';

export const InstructorAssignmentForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { configurations, fetchConfigurations } = useConfig();
  const { createAssignment, updateAssignment, createBulkAssignments } = useAssignment();
  const { showToast } = useToast();

  const [configurationId, setConfigurationId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('practice');
  const [theme, setTheme] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isBulk, setIsBulk] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchConfigurations();
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await apiService.getStudents();
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const assignmentData = {
      configurationId,
      name,
      description,
      assignmentType,
      theme: theme || undefined,
      availableFrom: new Date(availableFrom),
      availableUntil: new Date(availableUntil),
      deadline: new Date(deadline),
    };

    try {
      if (isBulk) {
        await createBulkAssignments(configurationId, selectedStudents, assignmentData);
        showToast('success', `Created assignment for ${selectedStudents.length} students!`);
      } else {
        await createAssignment({
          ...assignmentData,
          studentId: selectedStudents[0],
        });
        showToast('success', 'Assignment created successfully!');
      }
      navigate('/instructor/assignments');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    if (isBulk) {
      setSelectedStudents(prev =>
        prev.includes(studentId)
          ? prev.filter(id => id !== studentId)
          : [...prev, studentId]
      );
    } else {
      setSelectedStudents([studentId]);
    }
  };

  return (
    <PageLayout
      title="Create Assignment"
      subtitle="Assign a configuration to students with specific deadlines"
      actions={
        <Button
          variant="secondary"
          onClick={() => navigate('/instructor/assignments')}
          leftIcon={<ArrowLeft size={18} />}
        >
          Back
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card padding="lg">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Configuration *
              </label>
              <select
                value={configurationId}
                onChange={e => setConfigurationId(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="">Select a configuration...</option>
                {configurations.map(config => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Assignment Name *"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g., Midterm Negotiation Exercise"
            />

            <Textarea
              label="Description *"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={3}
              placeholder="Describe what students need to do..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Type *
                </label>
                <select
                  value={assignmentType}
                  onChange={e => setAssignmentType(e.target.value as AssignmentType)}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                >
                  <option value="practice">Practice</option>
                  <option value="exam">Exam</option>
                </select>
              </div>

              <Input
                label="Theme (optional)"
                type="text"
                value={theme}
                onChange={e => setTheme(e.target.value)}
                placeholder="e.g., Week 3, Midterm"
              />
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Available From *
                </label>
                <input
                  type="datetime-local"
                  value={availableFrom}
                  onChange={e => setAvailableFrom(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Available Until *
                </label>
                <input
                  type="datetime-local"
                  value={availableUntil}
                  onChange={e => setAvailableUntil(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Deadline *
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
            </div>
          </Card>

          <Card padding="lg">

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Users size={20} className="text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900">Student Selection</h2>
            </div>

            <div className="flex items-center mb-4 p-3 bg-sky-50 rounded-xl border border-sky-200">
              <input
                type="checkbox"
                id="bulk"
                checked={isBulk}
                onChange={e => {
                  setIsBulk(e.target.checked);
                  if (!e.target.checked) setSelectedStudents([]);
                }}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 mr-3"
              />
              <label htmlFor="bulk" className="text-sm font-medium text-neutral-700 cursor-pointer">
                Assign to multiple students
              </label>
            </div>

            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select Student{isBulk ? 's' : ''} *
              {selectedStudents.length > 0 && (
                <span className="ml-2 text-primary-600">
                  ({selectedStudents.length} selected)
                </span>
              )}
            </label>
            <div className="border-2 border-neutral-200 rounded-2xl p-4 max-h-60 overflow-y-auto bg-neutral-50">
              {students.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">No students found</p>
              ) : (
                students.map(student => (
                  <label
                    key={student.id}
                    className="flex items-center py-2 px-3 hover:bg-white rounded-xl cursor-pointer transition-colors"
                  >
                    <input
                      type={isBulk ? 'checkbox' : 'radio'}
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 mr-3"
                    />
                    <span className="text-neutral-900">{student.username}</span>
                  </label>
                ))
              )}
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/instructor/assignments')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={selectedStudents.length === 0}
                leftIcon={<Save size={18} />}
              >
                Create Assignment
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </PageLayout>
  );
};
