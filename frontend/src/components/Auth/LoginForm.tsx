import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Card } from '../ui';
import { ApiError } from '../../services/api.service';

// Maps a login failure to a message that points at the actual cause instead
// of a blanket "invalid credentials" - helps distinguish a typo from a
// network/CORS problem, rate limiting, or a server-side outage.
function describeLoginError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 0:
        return "Could not reach the server. Check your internet connection, or the server may be temporarily down - please try again in a minute.";
      case 401:
        return 'Incorrect username or password. Double-check for extra spaces or autocapitalized letters.';
      case 429:
        return 'Too many login attempts from this network. Please wait a minute and try again.';
      case 503:
        return 'This account is not fully configured on the server yet. Please try again shortly.';
      default:
        if (err.status >= 500) {
          return 'Something went wrong on our server. Please try again in a moment.';
        }
        return err.message || 'Login failed';
    }
  }
  return err instanceof Error ? err.message : 'Login failed';
}

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loggedInUser = await login(username, password);
      navigate(loggedInUser.role === 'instructor' ? '/instructor' : '/student');
    } catch (err) {
      setError(describeLoginError(err));
    } finally {
      setIsLoading(false);
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
            Welcome Back
          </h1>
          <p className="text-center text-neutral-600 mb-8">
            Sign in to your account to continue
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="username"
              type="text"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              leftIcon={<User size={18} />}
              placeholder="Enter your username"
            />

            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock size={18} />}
              rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              onRightIconClick={() => setShowPassword((v) => !v)}
              rightIconLabel={showPassword ? 'Hide password' : 'Show password'}
              placeholder="Enter your password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-6"
            >
              Sign In
            </Button>
          </form>

        </Card>
      </motion.div>
    </div>
  );
};
