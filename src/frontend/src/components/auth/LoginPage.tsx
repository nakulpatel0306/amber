import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Chrome, Github } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AuthDivider, AuthShell, PasswordToggle, authLinkClass } from './AuthShell';
import { APP_NAME } from '../../utils/constants';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, signInWithOAuth, checkEmailExists, isLoading } = useAuth();
  const { error: showError, info } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app';

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Check if email exists before attempting sign in
      setIsCheckingEmail(true);
      const { exists } = await checkEmailExists(email);
      setIsCheckingEmail(false);

      if (!exists) {
        info(
          'No account found',
          'You need an account to sign in. Please sign up first.'
        );
        navigate('/auth/signup');
        return;
      }

      await signInWithEmail(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setIsCheckingEmail(false);
      const message = err instanceof Error ? err.message : 'Failed to sign in';

      // Handle email not verified error
      if (message.includes('Email not confirmed') || message.includes('not confirmed')) {
        info(
          'Email not verified',
          'Please check your inbox and verify your email before signing in.'
        );
        navigate('/auth/verify-email', { state: { email } });
        return;
      }

      showError('Sign in failed', message);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      // Clear any stale signup role - login doesn't set a role
      // If user is new, AuthCallback will redirect them to role selection
      localStorage.removeItem('amber-signup-role');
      await signInWithOAuth(provider);
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to sign in with ${provider}`;
      showError('Sign in failed', message);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle={`Sign in to your ${APP_NAME} account.`}
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/auth/signup" className={authLinkClass}>
            Sign up
          </Link>
        </>
      }
    >
      <div className="space-y-3">
        <Button
          variant="secondary"
          fullWidth
          onClick={() => handleOAuthSignIn('google')}
          leftIcon={<Chrome className="w-4 h-4" />}
          disabled={isLoading}
        >
          Continue with Google
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => handleOAuthSignIn('github')}
          leftIcon={<Github className="w-4 h-4" />}
          disabled={isLoading}
        >
          Continue with GitHub
        </Button>
      </div>

      <AuthDivider label="or with email" />

      <form onSubmit={handleEmailSignIn} className="space-y-4" noValidate>
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

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Your password"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
            error={errors.password}
            disabled={isLoading}
          />
          <div className="flex justify-end mt-2">
            <Link to="/auth/forgot-password" className={`text-label ${authLinkClass}`}>
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading || isCheckingEmail}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
