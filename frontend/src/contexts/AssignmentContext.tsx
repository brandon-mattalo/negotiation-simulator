import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Assignment, AssignmentType, AssignmentStatus } from '../types/negotiation';
import { apiService } from '../services/api.service';

interface AssignmentContextValue {
  assignments: Assignment[];
  fetchAssignments: () => Promise<void>;
  createAssignment: (assignment: any) => Promise<Assignment>;
  createBulkAssignments: (configId: string, studentIds: string[], data: any) => Promise<Assignment[]>;
  updateAssignment: (id: string, assignment: Partial<Assignment>) => Promise<Assignment>;
  deleteAssignment: (id: string) => Promise<void>;
  filterByType: (type: AssignmentType | null) => Assignment[];
  filterByTheme: (theme: string | null) => Assignment[];
  filterByStatus: (status: AssignmentStatus | null) => Assignment[];
  isLoading: boolean;
  error: string | null;
}

const AssignmentContext = createContext<AssignmentContextValue | undefined>(undefined);

export const AssignmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getAssignments();
      setAssignments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createAssignment = async (assignment: any): Promise<Assignment> => {
    setIsLoading(true);
    setError(null);
    try {
      const newAssignment = await apiService.createAssignment(assignment);
      setAssignments(prev => [...prev, newAssignment]);
      return newAssignment;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createBulkAssignments = async (
    configId: string,
    studentIds: string[],
    data: any
  ): Promise<Assignment[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const newAssignments = await apiService.createBulkAssignments(configId, studentIds, data);
      setAssignments(prev => [...prev, ...newAssignments]);
      return newAssignments;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAssignment = async (id: string, assignment: Partial<Assignment>): Promise<Assignment> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await apiService.updateAssignment(id, assignment);
      setAssignments(prev => prev.map(a => (a.id === id ? updated : a)));
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAssignment = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiService.deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const filterByType = (type: AssignmentType | null): Assignment[] => {
    if (!type) return assignments;
    return assignments.filter(a => a.assignmentType === type);
  };

  const filterByTheme = (theme: string | null): Assignment[] => {
    if (!theme) return assignments;
    return assignments.filter(a => a.theme === theme);
  };

  const filterByStatus = (status: AssignmentStatus | null): Assignment[] => {
    if (!status) return assignments;
    return assignments.filter(a => a.status === status);
  };

  return (
    <AssignmentContext.Provider
      value={{
        assignments,
        fetchAssignments,
        createAssignment,
        createBulkAssignments,
        updateAssignment,
        deleteAssignment,
        filterByType,
        filterByTheme,
        filterByStatus,
        isLoading,
        error,
      }}
    >
      {children}
    </AssignmentContext.Provider>
  );
};

export const useAssignment = () => {
  const context = useContext(AssignmentContext);
  if (!context) {
    throw new Error('useAssignment must be used within AssignmentProvider');
  }
  return context;
};
