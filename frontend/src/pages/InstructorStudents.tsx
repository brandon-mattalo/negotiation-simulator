import React, { useEffect, useState, useMemo } from 'react';
import { UserPlus, Users, UserMinus, Search, Eye, EyeOff, Download, Plus, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '../services/api.service';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Button, Modal, Input, SkeletonCard } from '../components/ui';
import { useToast } from '../components/ui';
import { User } from '../types/negotiation';

interface EnrolledStudent extends User {
  enrolledAt?: string;
}

export const InstructorStudents: React.FC = () => {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [unenrollModalOpen, setUnenrollModalOpen] = useState(false);
  const [studentToUnenroll, setStudentToUnenroll] = useState<EnrolledStudent | null>(null);
  const [unenrolledStudents, setUnenrolledStudents] = useState<User[]>([]);
  const [loadingUnenrolled, setLoadingUnenrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, string>>({});
  const [loadingPasswords, setLoadingPasswords] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await apiService.getStudents();
      setStudents(data as EnrolledStudent[]);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openEnrollModal = async () => {
    setEnrollModalOpen(true);
    setSearchQuery('');
    setLoadingUnenrolled(true);
    try {
      const data = await apiService.getUnenrolledStudents();
      setUnenrolledStudents(data);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to fetch available students');
    } finally {
      setLoadingUnenrolled(false);
    }
  };

  const handleEnroll = async (username: string) => {
    setEnrolling(true);
    try {
      const student = await apiService.enrollStudent(username);
      setStudents(prev => [...prev, student as EnrolledStudent].sort((a, b) => a.username.localeCompare(b.username)));
      setUnenrolledStudents(prev => prev.filter(s => s.username !== username));
      showToast('success', `${username} enrolled successfully`);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to enroll student');
    } finally {
      setEnrolling(false);
    }
  };

  const confirmUnenroll = (student: EnrolledStudent) => {
    setStudentToUnenroll(student);
    setUnenrollModalOpen(true);
  };

  const handleUnenroll = async () => {
    if (!studentToUnenroll) return;
    setUnenrolling(true);
    try {
      await apiService.unenrollStudent(studentToUnenroll.id);
      setStudents(prev => prev.filter(s => s.id !== studentToUnenroll.id));
      showToast('success', `${studentToUnenroll.username} unenrolled successfully`);
      setUnenrollModalOpen(false);
      setStudentToUnenroll(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to unenroll student');
    } finally {
      setUnenrolling(false);
    }
  };

  const filteredUnenrolled = useMemo(() => {
    if (!searchQuery.trim()) return unenrolledStudents;
    return unenrolledStudents.filter(s =>
      s.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unenrolledStudents, searchQuery]);

  const generateUsername = () => {
    const adjectives = ['quick', 'bright', 'calm', 'bold', 'keen', 'swift', 'wise', 'fair', 'warm', 'cool'];
    const nouns = ['fox', 'owl', 'hawk', 'wolf', 'bear', 'deer', 'lynx', 'dove', 'lion', 'elk'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    setNewUsername(`${adj}-${noun}-${num}`);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pw = '';
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setNewPassword(pw);
  };

  const handleCreateStudent = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      showToast('error', 'Username and password are required');
      return;
    }
    setCreating(true);
    try {
      const student = await apiService.createStudent(newUsername.trim(), newPassword.trim());
      setStudents(prev => [...prev, student as EnrolledStudent].sort((a, b) => a.username.localeCompare(b.username)));
      showToast('success', `Student "${newUsername}" created and enrolled`);
      setCreateModalOpen(false);
      setNewUsername('');
      setNewPassword('');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create student');
    } finally {
      setCreating(false);
    }
  };

  const togglePassword = async (studentId: string) => {
    if (visiblePasswords[studentId]) {
      setVisiblePasswords(prev => { const next = { ...prev }; delete next[studentId]; return next; });
      return;
    }
    setLoadingPasswords(prev => ({ ...prev, [studentId]: true }));
    try {
      const password = await apiService.getStudentPassword(studentId);
      setVisiblePasswords(prev => ({ ...prev, [studentId]: password }));
    } catch (error: any) {
      showToast('error', error.message || 'Failed to retrieve password');
    } finally {
      setLoadingPasswords(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleExport = async () => {
    try {
      const blob = await apiService.exportStudentCredentials();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_credentials.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Credentials exported');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to export credentials');
    }
  };

  return (
    <PageLayout
      title="Students"
      subtitle={`${students.length} enrolled student${students.length !== 1 ? 's' : ''}`}
      actions={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleExport}
            leftIcon={<Download size={20} />}
          >
            Export Credentials
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => { setCreateModalOpen(true); setNewUsername(''); setNewPassword(''); }}
            leftIcon={<Plus size={20} />}
          >
            Create Student
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={openEnrollModal}
            leftIcon={<UserPlus size={20} />}
          >
            Enroll Student
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : students.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-neutral-100 flex items-center justify-center">
            <Users size={40} className="text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No Students Enrolled</h3>
          <p className="text-neutral-600 mb-6">
            Enroll students so they can access your configurations and assignments
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={openEnrollModal}
            leftIcon={<UserPlus size={20} />}
          >
            Enroll Student
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {students.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
            >
              <Card hover padding="md" className="border-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">
                      {student.username}
                    </h3>
                    {student.enrolledAt && (
                      <p className="text-sm text-neutral-500 mt-1">
                        Enrolled {new Date(student.enrolledAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {visiblePasswords[student.id] && (
                      <span className="text-sm font-mono bg-neutral-100 px-2 py-1 rounded">
                        {visiblePasswords[student.id]}
                      </span>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => togglePassword(student.id)}
                      disabled={loadingPasswords[student.id]}
                    >
                      {loadingPasswords[student.id] ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : visiblePasswords[student.id] ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => confirmUnenroll(student)}
                      leftIcon={<UserMinus size={16} />}
                    >
                      Unenroll
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Enroll Student Modal */}
      <Modal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title="Enroll Student"
        size="md"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
          />

          {loadingUnenrolled ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-neutral-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredUnenrolled.length === 0 ? (
            <p className="text-neutral-500 text-center py-6">
              {unenrolledStudents.length === 0
                ? 'All students are already enrolled'
                : 'No students match your search'}
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filteredUnenrolled.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <span className="font-medium text-neutral-900">{student.username}</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleEnroll(student.username)}
                    disabled={enrolling}
                  >
                    Enroll
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Create Student Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Student Account"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Username</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <Button variant="secondary" size="sm" onClick={generateUsername}>
                Random
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button variant="secondary" size="sm" onClick={generatePassword}>
                Random
              </Button>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateStudent} disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unenroll Confirmation Modal */}
      <Modal
        isOpen={unenrollModalOpen}
        onClose={() => { setUnenrollModalOpen(false); setStudentToUnenroll(null); }}
        title="Confirm Unenroll"
        size="sm"
      >
        <p className="text-neutral-700 mb-6">
          Are you sure you want to unenroll <strong>{studentToUnenroll?.username}</strong>? They will lose access to your configurations and assignments.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => { setUnenrollModalOpen(false); setStudentToUnenroll(null); }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleUnenroll}
            disabled={unenrolling}
          >
            {unenrolling ? 'Unenrolling...' : 'Unenroll'}
          </Button>
        </div>
      </Modal>
    </PageLayout>
  );
};
