import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Check,
  X,
  Sparkles,
  Crown,
  Zap,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { CANDIDATE_PLANS, EMPLOYER_PLANS, PricingPlan } from '../../lib/stripe/plans';
import { redirectToCheckout } from '../../lib/stripe/stripe';
import { IS_DEMO } from '../../demo/flag';

const tierIcons: Record<string, React.ElementType> = {
  free: Sparkles,
  pro: Zap,
  premium: Crown,
};

const tierAccent: Record<string, string> = {
  free: '#78716C',
  pro: '#E8A849',
  premium: '#D97706',
};

export function PricingPage() {
  const { user, isEmployer } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [activeTab, setActiveTab] = useState<'candidate' | 'employer'>(
    user ? (isEmployer ? 'employer' : 'candidate') : 'candidate'
  );
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const isPublic = !user;
  const plans = activeTab === 'employer' ? EMPLOYER_PLANS : CANDIDATE_PLANS;
  const dashboardPath = isEmployer ? '/app/employer' : '/app/dashboard';

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      navigate('/auth/signup');
      return;
    }

    if (plan.tier === 'free') {
      showSuccess('You\'re all set!', 'Enjoy your free plan');
      navigate(dashboardPath);
      return;
    }

    const priceId = billing === 'yearly' ? plan.stripeYearlyPriceId : plan.stripePriceId;
    if (!priceId) {
      showError('Not configured', `No Stripe price is set for the ${plan.name} plan.`);
      return;
    }

    setLoadingPlanId(plan.id);
    try {
      const error = await redirectToCheckout(priceId);
      if (error) {
        showError('Checkout error', error);
      }
    } catch {
      showError('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleSkip = () => {
    navigate(dashboardPath);
  };

  return (
    <div style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {isPublic && (
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium mb-8 transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-textMuted)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        )}

        {/* Welcome banner for first-time users */}
        {!isPublic && isWelcome && (
          <div
            className="p-6 rounded-2xl mb-8 border text-center"
            style={{
              backgroundColor: 'rgba(217, 119, 6, 0.08)',
              borderColor: 'var(--color-accent)',
            }}
          >
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              Welcome to Amber!
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-textSecondary)' }}>
              Your account is ready. Choose a plan to unlock the full experience, or start free.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Skip for now
            </Button>
          </div>
        )}

        <h1
          className="text-title mb-4"
          style={{ color: 'var(--color-text)' }}
        >
          {IS_DEMO ? 'Planned pricing' : 'Find your perfect plan'}
        </h1>
        <p
          className="text-sm sm:text-base max-w-2xl leading-relaxed text-pretty"
          style={{ color: 'var(--color-textSecondary)' }}
        >
          {IS_DEMO ? (
            <>
              These are the plans Amber planned to launch with. Every plan was going to start free, with
              connects for reaching out to matches and paid tiers for more. Paid plans were built as Stripe
              subscriptions (Checkout, Customer Portal and webhooks), but Amber never launched, so the demo
              doesn't sell anything.
            </>
          ) : (
            <>
              From casual networking to serious hiring, pick the plan that fits.
              Every plan starts free so you can explore before you commit. Use connects to
              reach out to matches, and upgrade when you are ready for more.
            </>
          )}
        </p>

        {/* Toggles */}
        <div className="flex flex-col items-start gap-3 mt-8">
          {/* Role toggle */}
          <div
            className="inline-flex rounded-xl p-1"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <button
              onClick={() => setActiveTab('candidate')}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: activeTab === 'candidate' ? 'var(--color-accent)' : 'transparent',
                color: activeTab === 'candidate' ? 'var(--color-accentText)' : 'var(--color-textSecondary)',
              }}
            >
              Job seekers
            </button>
            <button
              onClick={() => setActiveTab('employer')}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: activeTab === 'employer' ? 'var(--color-accent)' : 'transparent',
                color: activeTab === 'employer' ? 'var(--color-accentText)' : 'var(--color-textSecondary)',
              }}
            >
              Employers
            </button>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center gap-3 ml-1.5">
            <span
              className="text-sm font-medium"
              style={{ color: billing === 'monthly' ? 'var(--color-text)' : 'var(--color-textMuted)' }}
            >
              Monthly
            </span>
            <button
              onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ backgroundColor: billing === 'yearly' ? 'var(--color-accent)' : 'var(--color-border)' }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm"
                style={{ left: billing === 'yearly' ? '26px' : '2px' }}
              />
            </button>
            <span
              className="text-sm font-medium"
              style={{ color: billing === 'yearly' ? 'var(--color-text)' : 'var(--color-textMuted)' }}
            >
              Yearly
            </span>
            {billing === 'yearly' && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}
              >
                Save 20%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

      {/* Pricing cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map(plan => {
            const Icon = tierIcons[plan.tier];
            const accent = tierAccent[plan.tier];
            const price = billing === 'yearly' ? plan.yearlyPrice : plan.price;
            const isLoading = loadingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className="relative rounded-2xl p-5 flex flex-col transition-all hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: plan.popular
                    ? `2px solid ${accent}`
                    : '1px solid var(--color-border)',
                }}
              >
                {/* Plan header */}
                <div className="mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
                    style={{ backgroundColor: `${accent}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: accent }} />
                  </div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    {plan.name}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-textMuted)' }}>
                    {plan.tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {price === 0 ? (
                    <div className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
                      Free
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
                        ${price}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                        /mo
                      </span>
                    </div>
                  )}
                  {billing === 'yearly' && price > 0 && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-textMuted)' }}>
                      Billed ${price * 12}/year
                    </p>
                  )}
                </div>

                {/* The demo shows what each plan was going to be; it doesn't sell it */}
                {IS_DEMO ? (
                  <p
                    className="mb-4 rounded-lg border px-3 py-2 text-center text-caption"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-textMuted)' }}
                  >
                    {plan.tier === 'free' ? 'Planned free tier' : 'Planned Stripe subscription'}
                  </p>
                ) : (
                  <Button
                    className="w-full mb-4"
                    size="sm"
                    variant={plan.popular ? 'primary' : 'outline'}
                    onClick={() => handleSubscribe(plan)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting...
                      </span>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                )}

                {/* Features */}
                <div className="flex-1">
                  <ul className="space-y-2">
                    {plan.features.map(feature => (
                      <li key={feature} className="flex items-start gap-2 text-xs">
                        <Check
                          className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                          style={{ color: 'var(--color-success)' }}
                        />
                        <span style={{ color: 'var(--color-text)' }}>{feature}</span>
                      </li>
                    ))}
                    {plan.limitations?.map(limit => (
                      <li key={limit} className="flex items-start gap-2 text-xs">
                        <X
                          className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                          style={{ color: 'var(--color-textMuted)' }}
                        />
                        <span style={{ color: 'var(--color-textMuted)' }}>{limit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!isPublic && isWelcome && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 text-center">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Continue with free plan
          </Button>
        </div>
      )}
    </div>
  );
}
