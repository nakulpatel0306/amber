import { useState, useEffect, useRef } from 'react';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LocationPicker } from '../ui/LocationPicker';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../utils/cn';
import { optionClass } from '../assessments/QuestionParts';

interface CandidateSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  redirectToAssessment?: boolean;
}

interface CandidateData {
  headline: string;
  bio: string;
  location: string;
  years_experience: number | null;
  preferred_work_style: string;
  preferred_company_size: string;
  salary_expectation_min: number | null;
  salary_expectation_max: number | null;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
}

const WORK_STYLES = [
  { id: 'remote', label: 'Remote', description: 'Work from anywhere' },
  { id: 'hybrid', label: 'Hybrid', description: 'Mix of office and remote' },
  { id: 'onsite', label: 'On-site', description: 'Work at the office' },
  { id: 'flexible', label: 'Flexible', description: 'Open to all options' },
];

const COMPANY_SIZES = [
  { id: 'startup', label: 'Startup', description: '1-50 employees' },
  { id: 'small', label: 'Small', description: '50-200 employees' },
  { id: 'medium', label: 'Medium', description: '200-1000 employees' },
  { id: 'large', label: 'Large', description: '1000+ employees' },
  { id: 'any', label: 'Any size', description: 'Open to all' },
];

const STEPS = [
  { id: 'intro', title: 'Welcome' },
  { id: 'basic', title: 'About you' },
  { id: 'preferences', title: 'Preferences' },
  { id: 'links', title: 'Links' },
];

export function CandidateSetupModal({ isOpen, onClose, onComplete, redirectToAssessment = false }: CandidateSetupModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<CandidateData>({
    headline: '',
    bio: '',
    location: '',
    years_experience: null,
    preferred_work_style: 'flexible',
    preferred_company_size: 'any',
    salary_expectation_min: null,
    salary_expectation_max: null,
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
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

  // Load existing candidate data and resume from last step
  useEffect(() => {
    if (!userId || !isOpen || dataLoaded) return;

    const loadCandidateData = async () => {
      const { data: candidate } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (candidate) {
        setData({
          headline: candidate.headline || '',
          bio: candidate.bio || '',
          location: candidate.location || '',
          years_experience: candidate.years_experience,
          preferred_work_style: candidate.preferred_work_style || 'flexible',
          preferred_company_size: candidate.preferred_company_size || 'any',
          salary_expectation_min: candidate.salary_expectation_min,
          salary_expectation_max: candidate.salary_expectation_max,
          linkedin_url: candidate.linkedin_url || '',
          github_url: candidate.github_url || '',
          portfolio_url: candidate.portfolio_url || '',
        });
        // Resume from saved step (but not past the last step)
        if (candidate.setup_step && candidate.setup_step > 0 && candidate.setup_step < STEPS.length) {
          setCurrentStep(candidate.setup_step);
        }
      }
      setDataLoaded(true);
    };

    loadCandidateData();
  }, [userId, isOpen, dataLoaded]);

  // Save step data to database
  const saveStepData = async (step: number) => {
    if (!user) return;

    try {
      let upsertData: Record<string, unknown> = {
        user_id: user.id,
        setup_step: step,
      };

      // Include relevant data based on completed step
      if (step >= 1) {
        // Basic info step completed
        upsertData = {
          ...upsertData,
          headline: data.headline || null,
          bio: data.bio || null,
          location: data.location || null,
          years_experience: data.years_experience,
        };
      }
      if (step >= 2) {
        // Preferences step completed
        upsertData = {
          ...upsertData,
          preferred_work_style: data.preferred_work_style || null,
          preferred_company_size: data.preferred_company_size || null,
          salary_expectation_min: data.salary_expectation_min,
          salary_expectation_max: data.salary_expectation_max,
        };
      }
      if (step >= 3) {
        // Links step completed
        upsertData = {
          ...upsertData,
          linkedin_url: data.linkedin_url || null,
          github_url: data.github_url || null,
          portfolio_url: data.portfolio_url || null,
        };
      }

      await supabase
        .from('candidates')
        .upsert(upsertData, { onConflict: 'user_id' });
    } catch (err) {
      console.error('Error saving step data:', err);
    }
  };

  // Validation for each step
  const canProceedToNext = () => {
    if (currentStep === 0) return true; // Intro step
    if (currentStep === 1) {
      // Basic info - all mandatory
      return !!(data.headline && data.bio && data.location && data.years_experience !== null);
    }
    if (currentStep === 2) {
      // Preferences - work style and company size mandatory, salary optional
      return !!(data.preferred_work_style && data.preferred_company_size);
    }
    return true; // Links step is optional
  };

  const handleNext = async () => {
    if (!canProceedToNext()) return;

    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      // Save current step data before moving to next
      await saveStepData(nextStep);
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
      // Ensure a candidate record exists so assessment can work
      await supabase
        .from('candidates')
        .upsert({ user_id: user.id }, { onConflict: 'user_id' });

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

    setIsSaving(true);
    try {
      // Upsert candidate data - creates record if doesn't exist, updates if it does
      const { error: candidateError } = await supabase
        .from('candidates')
        .upsert({
          user_id: user.id,
          headline: data.headline || null,
          bio: data.bio || null,
          location: data.location || null,
          years_experience: data.years_experience,
          preferred_work_style: data.preferred_work_style || null,
          preferred_company_size: data.preferred_company_size || null,
          salary_expectation_min: data.salary_expectation_min,
          salary_expectation_max: data.salary_expectation_max,
          linkedin_url: data.linkedin_url || null,
          github_url: data.github_url || null,
          portfolio_url: data.portfolio_url || null,
          setup_step: STEPS.length,  // Mark all steps complete
          setup_completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (candidateError) throw candidateError;

      // Mark onboarding as complete
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      // Refresh profile to update the onboarding_completed flag in context
      await refreshProfile();

      success('Profile setup complete!', 'Your profile has been saved successfully.');
      onComplete();

      // Redirect to assessment page after completing setup
      if (redirectToAssessment) {
        navigate('/app/personality');
      }
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

  return (
    <>
      <div className="fixed inset-0 z-40 modal-backdrop" aria-hidden="true" />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="candidate-setup-title"
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
                description="Let's set up your profile so we can find jobs that fit you. It takes a few minutes, and you can skip it and finish later."
              />
            )}

            {currentStep === 1 && (
              <div className="space-y-5">
                <StepHeading
                  title="Tell us about yourself"
                  description="Help employers understand who you are. All fields are required."
                />

                <Input
                  label="Professional headline"
                  type="text"
                  value={data.headline}
                  onChange={(e) => setData({ ...data, headline: e.target.value })}
                  placeholder="e.g., Senior Product Designer with 5+ years experience"
                />

                <div>
                  <label
                    htmlFor="candidate-bio"
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Bio
                  </label>
                  <textarea
                    id="candidate-bio"
                    value={data.bio}
                    onChange={(e) => setData({ ...data, bio: e.target.value })}
                    placeholder="Tell us a bit about yourself, your experience, and what you're looking for..."
                    rows={3}
                    className={textareaClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                  <LocationPicker
                    label="Location"
                    value={data.location}
                    onChange={(location) => setData({ ...data, location })}
                    placeholder="Select your location"
                  />
                  <Input
                    label="Years of experience"
                    type="number"
                    value={data.years_experience?.toString() || ''}
                    onChange={(e) => setData({ ...data, years_experience: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="e.g., 5"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <StepHeading
                  title="Your work preferences"
                  description="Help us find jobs that match your ideal work environment."
                />

                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Preferred work style
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {WORK_STYLES.map((style) => (
                      <ChoiceTile
                        key={style.id}
                        selected={data.preferred_work_style === style.id}
                        onSelect={() => setData({ ...data, preferred_work_style: style.id })}
                        label={style.label}
                        description={style.description}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Preferred company size
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {COMPANY_SIZES.map((size) => (
                      <ChoiceTile
                        key={size.id}
                        selected={data.preferred_company_size === size.id}
                        onSelect={() => setData({ ...data, preferred_company_size: size.id })}
                        label={size.label}
                        description={size.description}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Salary expectations{' '}
                    <span className="font-normal" style={{ color: 'var(--color-textMuted)' }}>
                      USD per year, optional
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      aria-label="Minimum salary"
                      value={data.salary_expectation_min?.toString() || ''}
                      onChange={(e) => setData({ ...data, salary_expectation_min: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Minimum"
                    />
                    <Input
                      type="number"
                      aria-label="Maximum salary"
                      value={data.salary_expectation_max?.toString() || ''}
                      onChange={(e) => setData({ ...data, salary_expectation_max: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Maximum"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-5">
                <StepHeading
                  title="Share your work"
                  description="Optional. Add links that show your experience. You can update these anytime in settings."
                />

                <Input
                  label="LinkedIn profile"
                  type="url"
                  value={data.linkedin_url}
                  onChange={(e) => setData({ ...data, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                />

                <Input
                  label="GitHub profile"
                  type="url"
                  value={data.github_url}
                  onChange={(e) => setData({ ...data, github_url: e.target.value })}
                  placeholder="https://github.com/yourusername"
                />

                <Input
                  label="Portfolio or website"
                  type="url"
                  value={data.portfolio_url}
                  onChange={(e) => setData({ ...data, portfolio_url: e.target.value })}
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
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {currentStep === 0 ? 'Get started' : 'Continue'}
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                isLoading={isSaving}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {redirectToAssessment ? 'Complete and take assessment' : 'Complete setup'}
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
      <h2 id="candidate-setup-title" className="text-heading" style={{ color: 'var(--color-text)' }}>
        {title}
      </h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
        {description}
      </p>
    </div>
  );
}

function ChoiceTile({
  selected,
  onSelect,
  label,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  description: string;
}) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={cn(optionClass(selected), 'p-3')}>
      <span className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {label}
      </span>
      <span className="mt-0.5 block text-caption" style={{ color: 'var(--color-textSecondary)' }}>
        {description}
      </span>
    </button>
  );
}
