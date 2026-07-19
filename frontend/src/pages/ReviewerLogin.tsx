import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card } from '../components/ui';

// One-click login for academic journal reviewers. The credentials live only
// in the backend environment (Railway) and are exchanged for a token
// server-side, so no passwords are shipped to the browser. One-click access
// also avoids any chance of a reviewer mistyping credentials (the most common
// cause of a "can't log in" report).
type ReviewerRole = 'professor' | 'student';

export const ReviewerLogin: React.FC = () => {
  const [error, setError] = useState('');
  const [loadingRole, setLoadingRole] = useState<ReviewerRole | null>(null);

  const { reviewerLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (role: ReviewerRole) => {
    setError('');
    setLoadingRole(role);

    try {
      const loggedInUser = await reviewerLogin(role);
      navigate(loggedInUser.role === 'instructor' ? '/instructor' : '/student');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card padding="lg">
          {/* Brand Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-2xl shadow-soft-md">
              N
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-neutral-900 mb-2">
            Reviewer Access
          </h1>
          <p className="text-center text-neutral-600 mb-8">
            Choose an account below to sign in and explore the platform. No
            username or password required.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl mb-6"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <Button
              variant="primary"
              size="lg"
              isLoading={loadingRole === 'professor'}
              disabled={loadingRole !== null}
              onClick={() => handleLogin('professor')}
              leftIcon={<GraduationCap size={20} />}
              className="w-full"
            >
              Sign in as Professor
            </Button>

            <Button
              variant="secondary"
              size="lg"
              isLoading={loadingRole === 'student'}
              disabled={loadingRole !== null}
              onClick={() => handleLogin('student')}
              leftIcon={<BookOpen size={20} />}
              className="w-full"
            >
              Sign in as Student
            </Button>
          </div>

          <p className="text-center text-sm text-neutral-500 mt-8">
            Professor and student views are separate accounts. Sign out from
            within the app to switch between them here.
          </p>
        </Card>
      </motion.div>
    </div>
  );
};
