import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Chrome,
  Github,
  User,
  Building2,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AuthDivider, AuthShell, PasswordToggle, authLinkClass } from './AuthShell';
import { optionClass } from '../assessments/QuestionParts';
import type { UserRole } from '../../types/auth.types';

export function SignupPage() {
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithOAuth, checkEmailExists, isLoading } = useAuth();
  const { error: showError, info } = useToast();
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const [step, setStep] = useState<'role' | 'details'>('role');
  const [role, setRole] = useState<UserRole>('candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Name is required';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Check if email already exists
      setIsCheckingEmail(true);
      const { exists } = await checkEmailExists(email);
      setIsCheckingEmail(false);

      if (exists) {
        info(
          'Account exists',
          'You already have an account. Try signing in instead.'
        );
        navigate('/auth/login');
        return;
      }

      const result = await signUpWithEmail(email, password, role, { full_name: fullName });
      console.log('Signup result:', result);

      if (result.session) {
        // User is logged in immediately, navigate to appropriate dashboard
        const dashboardPath = role === 'employer' ? '/app/employer' : '/app/dashboard';
        console.log('Navigating to:', dashboardPath);
        navigate(dashboardPath, { replace: true });
      } else {
        // Email verification required - redirect to verify email page
        console.log('Email verification required, redirecting to verify-email');
        navigate('/auth/verify-email', { state: { email } });
      }
    } catch (err) {
      setIsCheckingEmail(false);
      const message = err instanceof Error ? err.message : 'Failed to create account';
      showError('Sign up failed', message);
    }
  };

  const handleOAuthSignUp = async (provider: 'google' | 'github') => {
    try {
      await signInWithOAuth(provider, role);
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to sign up with ${provider}`;
      showError('Sign up failed', message);
    }
  };

  const roleOptions = [
    {
      id: 'candidate' as const,
      label: 'I\'m looking for jobs',
      description: 'Find roles that match your personality and values',
      icon: User,
    },
    {
      id: 'employer' as const,
      label: 'I\'m Hiring',
      description: 'Find candidates who fit your company culture',
      icon: Building2,
    },
  ];

  return (
    <AuthShell
      title={step === 'role' ? 'Join Amber' : 'Create your account'}
      subtitle={
        step === 'role'
          ? 'Choose how you want to use Amber.'
          : `Signing up as ${role === 'candidate' ? 'a job seeker' : 'an employer'}.`
      }
      footer={
        <>
          Already have an account?{' '}
          <Link to="/auth/login" className={authLinkClass}>
            Sign in
          </Link>
        </>
      }
    >
      {step === 'role' ? (
        <>
          <div className="space-y-3 mb-5" role="radiogroup" aria-label="Account type">
            {roleOptions.map(option => {
              const selected = role === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setRole(option.id)}
                  className={optionClass(selected)}
                >
                  <div className="flex items-start gap-3">
                    <option.icon
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{ color: selected ? 'var(--color-accent)' : 'var(--color-textSecondary)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {option.label}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--color-textSecondary)' }}>
                        {option.description}
                      </p>
                    </div>
                    {selected && <Check className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-accent)' }} />}
                  </div>
                </button>
              );
            })}
          </div>

          <Button fullWidth onClick={() => setStep('details')}>
            Continue
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => handleOAuthSignUp('google')}
              leftIcon={<Chrome className="w-4 h-4" />}
              disabled={isLoading}
            >
              Continue with Google
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => handleOAuthSignUp('github')}
              leftIcon={<Github className="w-4 h-4" />}
              disabled={isLoading}
            >
              Continue with GitHub
            </Button>
          </div>

          <AuthDivider label="or with email" />

          <form onSubmit={handleEmailSignUp} className="space-y-4" noValidate>
            <Input
              label="Full name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.fullName}
              disabled={isLoading}
            />

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

            <Input
              label="Password"
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
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Type it again"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword}
              disabled={isLoading}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('role')}
                disabled={isLoading || isCheckingEmail}
              >
                Back
              </Button>
              <Button type="submit" fullWidth isLoading={isLoading || isCheckingEmail}>
                Create account
              </Button>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}
