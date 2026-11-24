import { useState, useEffect, useRef } from 'react';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LocationPicker } from '../ui/LocationPicker';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../utils/cn';
import { optionClass } from '../assessments/QuestionParts';

interface EmployerSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface EmployerData {
  company_name: string;
  description: string;
  company_size: string;
  industry: string;
  location: string;
  company_website: string;
  linkedin_url: string;
}

const COMPANY_SIZES = [
  { id: '1-10', label: 'Early stage', description: '1-10 employees' },
  { id: '11-50', label: 'Growing', description: '11-50 employees' },
  { id: '51-200', label: 'Scaling', description: '51-200 employees' },
];

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Media',
  'Consulting',
  'Non-profit',
  'Other',
];

const STEPS = [
  { id: 'intro', title: 'Welcome' },
  { id: 'company', title: 'Company' },
  { id: 'details', title: 'Details' },
  { id: 'links', title: 'Links' },
];

export function EmployerSetupModal({ isOpen, onClose, onComplete }: EmployerSetupModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { success, error: showError } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [, setValidationErrors] = useState<string[]>([]);
  const [data, setData] = useState<EmployerData>({
    company_name: '',
    description: '',
    company_size: '1-10',
    industry: '',
    location: '',
    company_website: '',
    linkedin_url: '',
  });

  // Track if we've loaded data for this modal session
  const [dataLoaded, setDataLoaded] = useState(false);

  // Reset dataLoaded when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setDataLoaded(false);
    }
  }, [isOpen]);

  // Use user.id as dependency to prevent unnecessary reloads
  const userId = user?.id;

  // Load existing employer data and resume from last step
  useEffect(() => {
    if (!userId || !isOpen || dataLoaded) return;

    const loadEmployerData = async () => {
      const { data: employer } = await supabase
        .from('employers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (employer) {
        setData({
          // Don't show "My Company" default - treat it as empty
          company_name: employer.company_name === 'My Company' ? '' : (employer.company_name || ''),
          description: employer.description || '',
          company_size: employer.company_size || '1-10',
          industry: employer.industry || '',
          location: employer.location || '',
          company_website: employer.company_website || '',
          linkedin_url: employer.linkedin_url || '',
        });
        // Resume from saved step (but not past the last step)
        if (employer.setup_step && employer.setup_step > 0 && employer.setup_step < STEPS.length) {
          setCurrentStep(employer.setup_step);
        }
      }
      setDataLoaded(true);
    };

    loadEmployerData();
  }, [userId, isOpen, dataLoaded]);

  // Validate required fields for current step
  const validateStep = (step: number): boolean => {
    const errors: string[] = [];

    if (step === 1) {
      // Company info step - all fields required
      if (!data.company_name.trim()) errors.push('Company name is required');
      if (!data.description.trim()) errors.push('Company description is required');
      if (!data.industry || data.industry === 'Other') errors.push('Please select or enter an industry');
    }

    if (step === 2) {
      // Details step - all fields required
      if (!data.company_size) errors.push('Please select company size');
      if (!data.location.trim()) errors.push('Headquarters location is required');
    }

    // Step 3 - Links step - both LinkedIn and website are optional
    // No validation needed for step 3

    setValidationErrors(errors);

    if (errors.length > 0) {
      showError('Missing required fields', errors.join('. '));
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      // Validate current step before proceeding (skip validation for intro step)
      if (currentStep > 0 && !validateStep(currentStep)) {
        return;
      }

      const nextStep = currentStep + 1;
      // Don't save to database until user completes setup
      setCurrentStep(nextStep);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    // Mark setup as completed even if skipped
    if (user) {
      // Ensure an employer record exists so culture quiz can work
      await supabase
        .from('employers')
        .upsert({ user_id: user.id, company_name: 'My Company' }, { onConflict: 'user_id' });

      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      // Refresh profile to update the onboarding_completed flag in context
      await refreshProfile();
    }
    onClose();
  };

  const handleComplete = async () => {
    if (!user) return;

    // Validate final step before completing
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSaving(true);
    try {
      // Upsert employer data - creates record if doesn't exist, updates if it does
      const { error: employerError } = await supabase
        .from('employers')
        .upsert({
          user_id: user.id,
          company_name: data.company_name,
          description: data.description || null,
          company_size: data.company_size || null,
          industry: data.industry || null,
          location: data.location || null,
          company_website: data.company_website || null,
          linkedin_url: data.linkedin_url || null,
          setup_step: STEPS.length,  // Mark all steps complete
          setup_completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (employerError) throw employerError;

      // Mark onboarding as complete
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      // Refresh profile to update the onboarding_completed flag in context
      await refreshProfile();

      success('Company setup complete!', 'You can update these details anytime in settings.');
      onComplete();
    } catch (err) {
      console.error('Setup error:', err);
      showError('Setup failed', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const dialogRef = useRef<HTMLDivElement>(null);
  // Escape means the same as Skip for now
  useDialogFocus(dialogRef, isOpen, handleSkip);

  if (!isOpen) return null;

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const hasCustomIndustry = data.industry === 'Other' || (!!data.industry && !INDUSTRIES.slice(0, -1).includes(data.industry));

  return (
    <>
      <div className="fixed inset-0 z-40 modal-backdrop" aria-hidden="true" />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="employer-setup-title"
          className="relative w-full max-w-xl max-h-[90vh] rounded-xl border overflow-hidden flex flex-col"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="px-6 pt-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-label tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip for now
              </Button>
            </div>
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%`, backgroundColor: 'var(--color-accent)' }}
              />
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {currentStep === 0 && (
              <StepHeading
                title={`Welcome, ${firstName}`}
                description="Let's set up your company profile so we can find candidates who fit. It takes a few minutes, and you can skip it and finish later."
              />
            )}

            {currentStep === 1 && (
              <div className="space-y-5">
                <StepHeading
                  title="Tell us about your company"
                  description="Help candidates understand who you are. All fields are required."
                />

                <Input
                  label="Company name"
                  type="text"
                  value={data.company_name}
                  onChange={(e) => setData({ ...data, company_name: e.target.value })}
                  placeholder="e.g., Acme Corporation"
                  required
                />

                <div>
                  <label
                    htmlFor="employer-description"
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Company description
                  </label>
                  <textarea
                    id="employer-description"
                    value={data.description}
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                    placeholder="Tell candidates about your company, mission, and what makes you unique..."
                    rows={3}
                    className={textareaClass}
                  />
                </div>

                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Industry
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((industry) => {
                      // "Other" stays selected while the user types a custom industry
                      const isSelected = industry === 'Other' ? hasCustomIndustry : data.industry === industry;
                      return (
                        <button
                          key={industry}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setData({ ...data, industry })}
                          className={cn(
                            'px-3 py-1.5 rounded-lg border text-label transition-colors',
                            isSelected
                              ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] text-[var(--color-text)]'
                              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-textSecondary)] hover:border-[var(--color-borderHover)]'
                          )}
                        >
                          {industry}
                        </button>
                      );
                    })}
                  </div>

                  {hasCustomIndustry && (
                    <div className="mt-3">
                      <Input
                        type="text"
                        aria-label="Your industry"
                        value={data.industry === 'Other' ? '' : data.industry}
                        onChange={(e) => setData({ ...data, industry: e.target.value || 'Other' })}
                        placeholder="Enter your industry"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <StepHeading
                  title="Company details"
                  description="Help us match you with the right candidates."
                />

                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Company size
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {COMPANY_SIZES.map((size) => (
                      <button
                        key={size.id}
                        type="button"
                        aria-pressed={data.company_size === size.id}
                        onClick={() => setData({ ...data, company_size: size.id })}
                        className={cn(optionClass(data.company_size === size.id), 'p-3')}
                      >
                        <span className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          {size.label}
                        </span>
                        <span className="mt-0.5 block text-caption" style={{ color: 'var(--color-textSecondary)' }}>
                          {size.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <LocationPicker
                  label="Headquarters location"
                  value={data.location}
                  onChange={(location) => setData({ ...data, location })}
                  placeholder="Select headquarters location"
                  required
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-5">
                <StepHeading
                  title="Company links"
                  description="Optional. Help candidates learn more about you. Next, take the culture quiz to start matching."
                />

                <Input
                  label="Your LinkedIn profile"
                  type="url"
                  value={data.linkedin_url}
                  onChange={(e) => setData({ ...data, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                />

                <Input
                  label="Company website"
                  type="url"
                  value={data.company_website}
                  onChange={(e) => setData({ ...data, company_website: e.target.value })}
                  placeholder="https://"
                />
              </div>
            )}
          </div>

          <div
            className="flex items-center justify-between gap-3 px-6 py-4 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div>
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrev} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
              )}
            </div>
            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
                {currentStep === 0 ? 'Get started' : 'Continue'}
              </Button>
            ) : (
              <Button onClick={handleComplete} isLoading={isSaving} rightIcon={<Check className="w-4 h-4" />}>
                Complete setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const textareaClass =
  'w-full px-4 py-2.5 rounded-xl border text-sm resize-none bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] placeholder:text-[var(--color-textMuted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]';

function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 id="employer-setup-title" className="text-heading" style={{ color: 'var(--color-text)' }}>
        {title}
      </h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
        {description}
      </p>
    </div>
  );
}
