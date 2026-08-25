import React, { useEffect, useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Plus, RefreshCw, Copy, Check, Power, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Button, Modal, Input, SkeletonCard } from '../components/ui';
import { useToast } from '../components/ui';
import { User } from '../types/negotiation';

interface CreatedInstructor {
  username: string;
  password: string;
}

export const InstructorTeam: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<CreatedInstructor | null>(null);
  const [copied, setCopied] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, string>>({});
  const [loadingPasswords, setLoadingPasswords] = useState<Record<string, boolean>>({});
  const [togglingActive, setTogglingActive] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const data = await apiService.getInstructors();
      setInstructors(data);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to fetch instructors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pw = '';
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setNewPassword(pw);
  };

  const openCreateModal = () => {
    setJustCreated(null);
    setCopied(false);
    setNewUsername('');
    setMakeAdmin(false);
    generatePassword();
    setCreateModalOpen(true);
  };

  const handleCreateInstructor = async () => {
    if (!newUsername.trim()) {
      showToast('error', 'Username is required');
      return;
    }
    setCreating(true);
    try {
      const { instructor, password } = await apiService.createInstructor(newUsername.trim(), newPassword.trim(), makeAdmin);
      setInstructors(prev => [...prev, instructor].sort((a, b) => a.username.localeCompare(b.username)));
      setJustCreated({ username: instructor.username, password });
      showToast('success', `Instructor "${instructor.username}" created`);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create instructor');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!justCreated) return;
    navigator.clipboard.writeText(`Username: ${justCreated.username}\nPassword: ${justCreated.password}`);
    setCopied(true);
  };

  const togglePassword = async (instructorId: string) => {
    if (visiblePasswords[instructorId]) {
      setVisiblePasswords(prev => { const next = { ...prev }; delete next[instructorId]; return next; });
      return;
    }
    setLoadingPasswords(prev => ({ ...prev, [instructorId]: true }));
    try {
      const password = await apiService.getInstructorPassword(instructorId);
      setVisiblePasswords(prev => ({ ...prev, [instructorId]: password }));
    } catch (error: any) {
      showToast('error', error.message || 'Failed to retrieve password');
    } finally {
      setLoadingPasswords(prev => ({ ...prev, [instructorId]: false }));
    }
  };

  const handleToggleActive = async (instructor: User) => {
    setTogglingActive(prev => ({ ...prev, [instructor.id]: true }));
    try {
      if (instructor.isActive) {
        await apiService.deactivateInstructor(instructor.id);
        showToast('success', `${instructor.username} deactivated`);
      } else {
        await apiService.reactivateInstructor(instructor.id);
        showToast('success', `${instructor.username} reactivated`);
      }
      setInstructors(prev =>
        prev.map(i => (i.id === instructor.id ? { ...i, isActive: !i.isActive } : i))
      );
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update account');
    } finally {
      setTogglingActive(prev => ({ ...prev, [instructor.id]: false }));
    }
  };

  const activeAdminCount = instructors.filter(i => i.isAdmin && i.isActive).length;

  return (
    <PageLayout
      title="Instructors"
      subtitle={`${instructors.length} instructor account${instructors.length !== 1 ? 's' : ''}`}
      actions={
        <Button variant="primary" size="lg" onClick={openCreateModal} leftIcon={<Plus size={20} />}>
          Add Instructor
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {instructors.map((instructor, index) => {
            const isSelf = instructor.id === currentUser?.id;
            const isLastActiveAdmin = instructor.isAdmin && instructor.isActive && activeAdminCount <= 1;
            const disableToggle = isSelf || (instructor.isActive && isLastActiveAdmin);

            return (
              <motion.div
                key={instructor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
              >
                <Card hover padding="md" className={`border-2 ${!instructor.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-neutral-900">
                          {instructor.username}
                        </h3>
                        {instructor.isAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                            <ShieldCheck size={12} /> Admin
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-xs text-neutral-400">(you)</span>
                        )}
                        {!instructor.isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600 text-xs font-semibold">
                            Deactivated
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {visiblePasswords[instructor.id] && (
                        <span className="text-sm font-mono bg-neutral-100 px-2 py-1 rounded">
                          {visiblePasswords[instructor.id]}
                        </span>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => togglePassword(instructor.id)}
                        disabled={loadingPasswords[instructor.id]}
                      >
                        {loadingPasswords[instructor.id] ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : visiblePasswords[instructor.id] ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </Button>
                      <Button
                        variant={instructor.isActive ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleActive(instructor)}
                        disabled={disableToggle || togglingActive[instructor.id]}
                        leftIcon={instructor.isActive ? <Power size={16} /> : <RotateCcw size={16} />}
                        title={
                          isSelf
                            ? "You can't deactivate your own account"
                            : disableToggle
                            ? "Can't deactivate the only remaining admin"
                            : undefined
                        }
                      >
                        {instructor.isActive ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Instructor Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Instructor"
        size="md"
      >
        {justCreated ? (
          <div className="space-y-4">
            <p className="text-neutral-700">
              Account created. Copy these credentials now and share them with your colleague — the password won't be shown again here unless password recovery is configured on the server.
            </p>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2 font-mono text-sm">
              <div><span className="text-neutral-500">Username:</span> {justCreated.username}</div>
              <div><span className="text-neutral-500">Password:</span> {justCreated.password}</div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="secondary"
                onClick={handleCopyCredentials}
                leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button variant="primary" onClick={() => setCreateModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Username</label>
              <Input
                placeholder="e.g. jsmith"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
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
            <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-200">
              <input
                type="checkbox"
                id="makeAdmin"
                checked={makeAdmin}
                onChange={(e) => setMakeAdmin(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="makeAdmin" className="text-sm font-medium text-neutral-700 cursor-pointer">
                Also make this account an admin (can create/deactivate other instructors)
              </label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateInstructor} disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};
