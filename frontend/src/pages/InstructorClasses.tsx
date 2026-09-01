import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Pencil, Archive, ArchiveRestore, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '../services/api.service';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Button, Modal, Input, SkeletonCard } from '../components/ui';
import { useToast } from '../components/ui';
import { Class } from '../types/negotiation';

export const InstructorClasses: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);

  const [renameTarget, setRenameTarget] = useState<Class | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);

  const [archiveTarget, setArchiveTarget] = useState<Class | null>(null);
  const [archiving, setArchiving] = useState(false);

  const [unarchivingId, setUnarchivingId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Class | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await apiService.getClasses();
      setClasses(data);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const activeClasses = classes.filter(c => !c.isArchived);
  const archivedClasses = classes.filter(c => c.isArchived);

  const handleCreate = async () => {
    if (!newClassName.trim()) {
      showToast('error', 'Class name is required');
      return;
    }
    setCreating(true);
    try {
      const cls = await apiService.createClass(newClassName.trim());
      setClasses(prev => [...prev, cls].sort((a, b) => a.name.localeCompare(b.name)));
      showToast('success', `Class "${cls.name}" created`);
      setCreateModalOpen(false);
      setNewClassName('');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const openRename = (cls: Class) => {
    setRenameTarget(cls);
    setRenameValue(cls.name);
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    setRenaming(true);
    try {
      const updated = await apiService.renameClass(renameTarget.id, renameValue.trim());
      setClasses(prev => prev.map(c => (c.id === updated.id ? { ...c, name: updated.name } : c)));
      showToast('success', 'Class renamed');
      setRenameTarget(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to rename class');
    } finally {
      setRenaming(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await apiService.archiveClass(archiveTarget.id);
      showToast('success', `"${archiveTarget.name}" archived, along with its students`);
      setArchiveTarget(null);
      fetchClasses();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to archive class');
    } finally {
      setArchiving(false);
    }
  };

  const handleUnarchive = async (cls: Class) => {
    setUnarchivingId(cls.id);
    try {
      await apiService.unarchiveClass(cls.id);
      showToast('success', `"${cls.name}" unarchived`);
      fetchClasses();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to unarchive class');
    } finally {
      setUnarchivingId(null);
    }
  };

  const openDelete = (cls: Class) => {
    setDeleteTarget(cls);
    setDeleteConfirmText('');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiService.deleteClass(deleteTarget.id);
      showToast('success', `"${deleteTarget.name}" and its students were permanently deleted`);
      setDeleteTarget(null);
      fetchClasses();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete class');
    } finally {
      setDeleting(false);
    }
  };

  const renderClassCard = (cls: Class, index: number) => (
    <motion.div
      key={cls.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
    >
      <Card hover padding="md" className={`border-2 ${cls.isArchived ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-neutral-900">{cls.name}</h3>
              {cls.isArchived && (
                <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600 text-xs font-semibold">
                  Archived
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              {cls.studentCount ?? 0} student{cls.studentCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {cls.isArchived ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUnarchive(cls)}
                  disabled={unarchivingId === cls.id}
                  leftIcon={<ArchiveRestore size={16} />}
                >
                  Unarchive
                </Button>
                <Button variant="danger" size="sm" onClick={() => openDelete(cls)} leftIcon={<Trash2 size={16} />}>
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={() => openRename(cls)} leftIcon={<Pencil size={16} />}>
                  Rename
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setArchiveTarget(cls)} leftIcon={<Archive size={16} />}>
                  Archive
                </Button>
                <Button variant="danger" size="sm" onClick={() => openDelete(cls)} leftIcon={<Trash2 size={16} />}>
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <PageLayout
      title="Classes"
      subtitle={`${activeClasses.length} class${activeClasses.length !== 1 ? 'es' : ''}`}
      actions={
        <Button variant="primary" size="lg" onClick={() => setCreateModalOpen(true)} leftIcon={<Plus size={20} />}>
          Create Class
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : activeClasses.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-neutral-100 flex items-center justify-center">
            <BookOpen size={40} className="text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No Classes Yet</h3>
          <p className="text-neutral-600 mb-6">
            Create a class to organize your students. Students can then be bulk-assigned to it from the Students page.
          </p>
          <Button variant="primary" size="lg" onClick={() => setCreateModalOpen(true)} leftIcon={<Plus size={20} />}>
            Create Class
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">{activeClasses.map(renderClassCard)}</div>
      )}

      {archivedClasses.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowArchived(v => !v)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-semibold"
          >
            {showArchived ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            Archived ({archivedClasses.length})
          </button>
          {showArchived && (
            <div className="mt-3 space-y-4">{archivedClasses.map(renderClassCard)}</div>
          )}
        </div>
      )}

      {/* Create Class Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Class" size="sm">
        <div className="space-y-4">
          <Input
            placeholder="e.g. Section A, Fall 2026"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal isOpen={!!renameTarget} onClose={() => setRenameTarget(null)} title="Rename Class" size="sm">
        <div className="space-y-4">
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRename} disabled={renaming}>
              {renaming ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Archive Confirmation Modal */}
      <Modal isOpen={!!archiveTarget} onClose={() => setArchiveTarget(null)} title="Archive Class" size="sm">
        <p className="text-neutral-700 mb-6">
          Archiving <strong>{archiveTarget?.name}</strong> will also archive all {archiveTarget?.studentCount ?? 0} of its current students — they'll lose login access until manually unarchived and reassigned.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setArchiveTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleArchive} disabled={archiving}>
            {archiving ? 'Archiving...' : 'Archive'}
          </Button>
        </div>
      </Modal>

      {/* Permanent Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Permanently Delete Class" size="sm">
        <div className="space-y-4">
          <p className="text-neutral-700">
            This will <strong>permanently delete</strong> the class <strong>{deleteTarget?.name}</strong> and all {deleteTarget?.studentCount ?? 0} of its current students, including their full session history. This action <strong>cannot be undone</strong>.
          </p>
          <p className="text-sm text-neutral-600">
            Type the class name (<strong>{deleteTarget?.name}</strong>) to confirm.
          </p>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={deleteTarget?.name}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting || deleteConfirmText !== deleteTarget?.name}
            >
              {deleting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};
