import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AuthShell, PasswordToggle, authLinkClass } from './AuthShell';

type Step = 'request' | 'reset' | 'success';

export function PasswordResetPage() {
  const navigate = useNavigate();
  const { resetPassword, updatePassword, isLoading, session } = useAuth();
  const { error: showError, success } = useToast();

  // Determine initial step based on URL params
  const [step, setStep] = useState<Step>(() => {
    // If there's a session (user clicked reset link), go to reset step
    if (session) return 'reset';
    return 'request';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // If session exists and we're on this page, user clicked reset link
    if (session) {
      setStep('reset');
    }
  }, [session]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Please enter a valid email' });
      return;
    }

    try {
      await resetPassword(email);
      setStep('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      showError('Error', message);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await updatePassword(password);
      success('Password updated', 'Your password has been successfully changed.');
      navigate('/auth/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      showError('Error', message);
    }
  };

  const titles: Record<Step, string> = {
    request: 'Reset your password',
    reset: 'Set a new password',
    success: 'Check your email',
  };
  const subtitles: Record<Step, string> = {
    request: "Enter your account's email and we'll send you a reset link.",
    reset: 'Choose a new password for your account.',
    success: `We sent a reset link to ${email}.`,
  };

  return (
    <AuthShell title={titles[step]} subtitle={subtitles[step]} back={{ to: '/auth/login', label: 'Back to sign in' }}>
      {step === 'request' && (
        <form onSubmit={handleRequestReset} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email}
            disabled={isLoading}
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            Send reset link
          </Button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleUpdatePassword} className="space-y-4" noValidate>
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
            error={errors.password}
            disabled={isLoading}
          />

          <Input
            label="Confirm new password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Type it again"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword}
            disabled={isLoading}
          />

          <Button type="submit" fullWidth isLoading={isLoading}>
            Update password
          </Button>
        </form>
      )}

      {step === 'success' && (
        <div className="space-y-4">
          <p className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
            <span>
              Didn't get it? Check your spam folder, or{' '}
              <button type="button" onClick={() => setStep('request')} className={authLinkClass}>
                try another email address
              </button>
              .
            </span>
          </p>

          <Button variant="secondary" fullWidth onClick={() => navigate('/auth/login')}>
            Back to sign in
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
