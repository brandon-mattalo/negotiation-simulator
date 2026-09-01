import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, Eye, EyeOff, Download, Plus, RefreshCw, Copy, Check,
  Archive, ArchiveRestore, Trash2, FolderInput, ChevronDown, ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '../services/api.service';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Button, Modal, Input, SkeletonCard } from '../components/ui';
import { useToast } from '../components/ui';
import { Roster, RosterStudent } from '../types/negotiation';

type Section = { title: string; classId: string | null; students: RosterStudent[] };

export const InstructorStudents: React.FC = () => {
  const [roster, setRoster] = useState<Roster | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, string>>({});
  const [loadingPasswords, setLoadingPasswords] = useState<Record<string, boolean>>({});

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createCount, setCreateCount] = useState('1');
  const [createClassId, setCreateClassId] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<Array<{ username: string; password: string }> | null>(null);
  const [copied, setCopied] = useState(false);

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveTargetClassId, setMoveTargetClassId] = useState('');
  const [moving, setMoving] = useState(false);

  const [archiving, setArchiving] = useState(false);
  const [unarchiving, setUnarchiving] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();

  const fetchRoster = async () => {
    try {
      setLoading(true);
      const data = await apiService.getRoster();
      setRoster(data);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  const studentById = useMemo(() => {
    const map = new Map<string, RosterStudent>();
    if (roster) {
      roster.classes.forEach(c => c.students.forEach(s => map.set(s.id, s)));
      roster.unassigned.forEach(s => map.set(s.id, s));
      roster.archived.forEach(s => map.set(s.id, s));
    }
    return map;
  }, [roster]);

  const selectedRows = useMemo(() => [...selected].map(id => studentById.get(id)).filter(Boolean) as RosterStudent[], [selected, studentById]);
  const selectedActive = selectedRows.filter(s => s.isActive);
  const selectedArchived = selectedRows.filter(s => !s.isActive);
  const mixedSelection = selectedActive.length > 0 && selectedArchived.length > 0;

  const totalStudents = roster ? roster.classes.reduce((n, c) => n + c.students.length, 0) + roster.unassigned.length + roster.archived.length : 0;

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSection = (students: RosterStudent[]) => {
    const ids = students.map(s => s.id);
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pw = '';
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setCreatePassword(pw);
  };

  const openCreateModal = () => {
    setJustCreated(null);
    setCopied(false);
    setCreateCount('1');
    setCreateClassId('');
    generatePassword();
    setCreateModalOpen(true);
  };

  const handleCreateStudents = async () => {
    const count = parseInt(createCount, 10);
    if (!count || count < 1 || count > 100) {
      showToast('error', 'Enter a count between 1 and 100');
      return;
    }
    setCreating(true);
    try {
      const students = await apiService.bulkCreateStudents(count, {
        classId: createClassId || undefined,
        password: count === 1 ? (createPassword.trim() || undefined) : undefined,
      });
      setJustCreated(students);
      showToast('success', `${students.length} student${students.length !== 1 ? 's' : ''} created`);
      fetchRoster();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create students');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!justCreated) return;
    const text = justCreated.map(s => `${s.username}\t${s.password}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
  };

  const handleDownloadCredentials = () => {
    if (!justCreated) return;
    const csv = 'username,password\n' + justCreated.map(s => `${s.username},${s.password}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'new_students.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
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

  const openMoveModal = () => {
    setMoveTargetClassId('');
    setMoveModalOpen(true);
  };

  const handleMove = async () => {
    setMoving(true);
    try {
      await apiService.bulkAssignClass([...selected], moveTargetClassId || null);
      showToast('success', `${selected.size} student${selected.size !== 1 ? 's' : ''} moved`);
      setMoveModalOpen(false);
      clearSelection();
      fetchRoster();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to move students');
    } finally {
      setMoving(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await apiService.bulkArchiveStudents([...selected]);
      showToast('success', `${selected.size} student${selected.size !== 1 ? 's' : ''} archived`);
      clearSelection();
      fetchRoster();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to archive students');
    } finally {
      setArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    setUnarchiving(true);
    try {
      await apiService.bulkUnarchiveStudents([...selected]);
      showToast('success', `${selected.size} student${selected.size !== 1 ? 's' : ''} unarchived to Unassigned`);
      clearSelection();
      fetchRoster();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to unarchive students');
    } finally {
      setUnarchiving(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const count = await apiService.bulkDeleteStudents([...selected]);
      showToast('success', `${count} student${count !== 1 ? 's' : ''} permanently deleted`);
      setDeleteModalOpen(false);
      clearSelection();
      fetchRoster();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete students');
    } finally {
      setDeleting(false);
    }
  };

  const activeClasses = roster?.classes.map(c => c.class) || [];

  const renderRow = (student: RosterStudent, index: number) => (
    <motion.div
      key={student.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 20) * 0.01 }}
    >
      <Card hover padding="md" className={`border-2 ${!student.isActive ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selected.has(student.id)}
              onChange={() => toggleOne(student.id)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <div>
              <h3 className="text-base font-bold text-neutral-900">{student.username}</h3>
              <p className="text-sm text-neutral-500 mt-0.5">
                Enrolled {new Date(student.enrolledAt).toLocaleDateString()}
                {!student.isActive && <span className="ml-2 px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600 text-xs font-semibold">Archived</span>}
              </p>
            </div>
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
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const renderSection = (title: string, students: RosterStudent[]) => {
    if (students.length === 0) return null;
    const allSelected = students.length > 0 && students.every(s => selected.has(s.id));
    return (
      <div key={title} className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => toggleSection(students)}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <h2 className="text-lg font-bold text-neutral-800">{title}</h2>
          <span className="text-sm text-neutral-500">
            {students.length} student{students.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="space-y-3 pl-7">
          {students.map((s, i) => renderRow(s, i))}
        </div>
      </div>
    );
  };

  return (
    <PageLayout
      title="Students"
      subtitle={`${totalStudents} student${totalStudents !== 1 ? 's' : ''}`}
      actions={
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" onClick={handleExport} leftIcon={<Download size={20} />}>
            Export Credentials
          </Button>
          <Button variant="primary" size="lg" onClick={openCreateModal} leftIcon={<Plus size={20} />}>
            Create Students
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
      ) : totalStudents === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-neutral-100 flex items-center justify-center">
            <Users size={40} className="text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No Students Yet</h3>
          <p className="text-neutral-600 mb-6">
            Create anonymous student accounts so they can access your configurations and assignments
          </p>
          <Button variant="primary" size="lg" onClick={openCreateModal} leftIcon={<Plus size={20} />}>
            Create Students
          </Button>
        </Card>
      ) : (
        <div className="space-y-8 pb-24">
          {roster!.classes.map(c => renderSection(c.class.name, c.students))}
          {renderSection('Unassigned', roster!.unassigned)}

          {roster!.archived.length > 0 && (
            <div>
              <button
                onClick={() => setShowArchived(v => !v)}
                className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-semibold"
              >
                {showArchived ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                Archived ({roster!.archived.length})
              </button>
              {showArchived && (
                <div className="mt-3">
                  {renderSection('Archived', roster!.archived)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating bulk-action toolbar */}
      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <Card padding="md" className="shadow-2xl border-2 flex items-center gap-3 bg-white">
            <span className="text-sm font-semibold text-neutral-700 px-2">
              {selected.size} selected
            </span>
            {mixedSelection ? (
              <span className="text-sm text-neutral-500 px-2">
                Select only active or only archived students to act on them together
              </span>
            ) : selectedArchived.length > 0 ? (
              <>
                <Button variant="secondary" size="sm" onClick={handleUnarchive} disabled={unarchiving} leftIcon={<ArchiveRestore size={16} />}>
                  {unarchiving ? 'Unarchiving...' : 'Unarchive'}
                </Button>
                <Button variant="danger" size="sm" onClick={openDeleteModal} leftIcon={<Trash2 size={16} />}>
                  Delete Permanently
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={openMoveModal} leftIcon={<FolderInput size={16} />}>
                  Move to Class
                </Button>
                <Button variant="secondary" size="sm" onClick={handleArchive} disabled={archiving} leftIcon={<Archive size={16} />}>
                  {archiving ? 'Archiving...' : 'Archive'}
                </Button>
                <Button variant="danger" size="sm" onClick={openDeleteModal} leftIcon={<Trash2 size={16} />}>
                  Delete Permanently
                </Button>
              </>
            )}
            <Button variant="secondary" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Create Students Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Students" size="md">
        {justCreated ? (
          <div className="space-y-4">
            <p className="text-neutral-700">
              {justCreated.length} account{justCreated.length !== 1 ? 's' : ''} created. Copy these credentials now — passwords won't be shown again here unless password recovery is configured on the server.
            </p>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 max-h-64 overflow-y-auto font-mono text-sm space-y-1">
              {justCreated.map(s => (
                <div key={s.username} className="flex justify-between gap-4">
                  <span>{s.username}</span>
                  <span className="text-neutral-500">{s.password}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={handleDownloadCredentials} leftIcon={<Download size={16} />}>
                Download CSV
              </Button>
              <Button variant="secondary" onClick={handleCopyCredentials} leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}>
                {copied ? 'Copied' : 'Copy All'}
              </Button>
              <Button variant="primary" onClick={() => setCreateModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500">
              Student accounts are anonymous — usernames are generated automatically, never something you type in.
            </p>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">How many?</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={createCount}
                onChange={(e) => setCreateCount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Class</label>
              <select
                value={createClassId}
                onChange={(e) => setCreateClassId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
              >
                <option value="">Unassigned</option>
                {activeClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {parseInt(createCount, 10) === 1 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                  />
                  <Button variant="secondary" size="sm" onClick={generatePassword}>
                    Random
                  </Button>
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateStudents} disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Move to Class Modal */}
      <Modal isOpen={moveModalOpen} onClose={() => setMoveModalOpen(false)} title="Move to Class" size="sm">
        <div className="space-y-4">
          <p className="text-neutral-700">
            Move {selected.size} student{selected.size !== 1 ? 's' : ''} to:
          </p>
          <select
            value={moveTargetClassId}
            onChange={(e) => setMoveTargetClassId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          >
            <option value="">Unassigned</option>
            {activeClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setMoveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleMove} disabled={moving}>
              {moving ? 'Moving...' : 'Move'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Permanent Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Permanently Delete Students" size="sm">
        <div className="space-y-4">
          <p className="text-neutral-700">
            This will <strong>permanently delete</strong> {selected.size} student account{selected.size !== 1 ? 's' : ''} and all of their session history. This action <strong>cannot be undone</strong>.
          </p>
          <p className="text-sm text-neutral-600">
            Type <strong>DELETE</strong> to confirm.
          </p>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting || deleteConfirmText !== 'DELETE'}
            >
              {deleting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};
