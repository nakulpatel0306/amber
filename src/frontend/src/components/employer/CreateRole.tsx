import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Facts } from '../ui/Facts';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { JOB_SECTORS } from '../../utils/constants';
import { cn } from '../../utils/cn';

type CreateRoleStep = 'basics' | 'details' | 'culture' | 'review' | 'saving' | 'complete';

interface RoleFormData {
  title: string;
  sector: string;
  location: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  employmentType: 'full_time' | 'part_time' | 'contract' | 'internship';
  salaryMin: string;
  salaryMax: string;
  description: string;
  requirements: string;
  preferredTraits: string[];
  teamSize: string;
  reportingTo: string;
}

const traitOptions = [
  { value: 'collaborative', label: 'Collaborative' },
  { value: 'independent', label: 'Independent' },
  { value: 'creative', label: 'Creative' },
  { value: 'analytical', label: 'Analytical' },
  { value: 'detail-oriented', label: 'Detail-oriented' },
  { value: 'big-picture', label: 'Big-picture thinker' },
  { value: 'fast-paced', label: 'Thrives in fast pace' },
  { value: 'methodical', label: 'Methodical' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'direct', label: 'Direct communicator' },
  { value: 'adaptable', label: 'Adaptable' },
  { value: 'structured', label: 'Prefers structure' },
];

const STEPS = [
  { key: 'basics', title: 'Basics', description: 'The title, team and terms of the role.' },
  { key: 'details', title: 'Details', description: 'What the job involves and what it takes.' },
  {
    key: 'culture',
    title: 'Ideal candidate traits',
    description: 'Pick at least 2. They combine with your company culture profile to find the best fit for this role.',
  },
  { key: 'review', title: 'Review', description: 'Check everything before the role goes live.' },
] as const;

const fieldClass =
  'w-full px-3 py-2.5 rounded-lg border text-sm bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] placeholder:text-[var(--color-textMuted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]';

function parseSalary(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  if (value.toLowerCase().includes('k') || num < 1000) {
    return num * 1000;
  }
  return num;
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export function CreateRole() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [step, setStep] = useState<CreateRoleStep>('basics');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    title: '',
    sector: '',
    location: '',
    locationType: 'remote',
    employmentType: 'full_time',
    salaryMin: '',
    salaryMax: '',
    description: '',
    requirements: '',
    preferredTraits: [],
    teamSize: '',
    reportingTo: '',
  });

  const updateField = <K extends keyof RoleFormData>(field: K, value: RoleFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTrait = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      preferredTraits: prev.preferredTraits.includes(trait)
        ? prev.preferredTraits.filter(t => t !== trait)
        : [...prev.preferredTraits, trait],
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setStep('saving');
    setSubmitError(null);

    try {
      const { data: employer, error: employerError } = await supabase
        .from('employers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (employerError || !employer) {
        throw new Error('No employer profile found. Please complete your company setup first.');
      }

      const requirementsArray = formData.requirements
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean);

      const { error: insertError } = await supabase
        .from('roles')
        .insert({
          employer_id: employer.id,
          title: formData.title,
          description: formData.description,
          requirements: requirementsArray,
          nice_to_have: formData.preferredTraits,
          location: formData.location,
          work_style: formData.locationType,
          salary_min: parseSalary(formData.salaryMin),
          salary_max: parseSalary(formData.salaryMax),
          employment_type: formData.employmentType,
          status: 'active',
        });

      if (insertError) throw insertError;

      success('Role created!', `${formData.title} is now live and ready for matching.`);
      setStep('complete');
    } catch (err) {
      console.error('Error creating role:', err);
      const message = err instanceof Error ? err.message : 'Failed to create role. Please try again.';
      setSubmitError(message);
      showError('Failed to create role', message);
      setStep('review');
    }
  };

  const canProceedFromBasics = formData.title && formData.sector && formData.location && formData.salaryMin && formData.salaryMax;
  const canProceedFromDetails = formData.description && formData.requirements && formData.teamSize && formData.reportingTo;
  const canProceedFromCulture = formData.preferredTraits.length >= 2;

  const sectorLabel = JOB_SECTORS.find(s => s.id === formData.sector)?.label || formData.sector;
  const currentStepIndex = STEPS.findIndex(s => s.key === step);

  if (step === 'saving') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
            Creating your role
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            Setting up candidate matching
          </p>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <motion.div
          className="max-w-2xl mx-auto px-4 sm:px-6 py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-title" style={{ color: 'var(--color-text)' }}>
            Role created
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            {formData.title} is now live. We're matching candidates to your culture preferences.
          </p>
          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
            <Button variant="outline" onClick={() => navigate('/app/employer/roles')}>
              View all roles
            </Button>
            <Button onClick={() => navigate('/app/employer/top-candidates')} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Browse candidates
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const stepMeta = STEPS[currentStepIndex];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        <h1 className="text-title" style={{ color: 'var(--color-text)' }}>
          Create a role
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
          Define the position and the kind of person who'd thrive in it.
        </p>

        <div className="mt-6">
          <p className="text-label tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
            Step {currentStepIndex + 1} of {STEPS.length}
          </p>
          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`, backgroundColor: 'var(--color-accent)' }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.section key={step} className="bento-card mt-6" {...fade}>
            <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
              {stepMeta.title}
            </h2>
            <p className="mt-1 mb-6 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
              {stepMeta.description}
            </p>

            {step === 'basics' && (
              <div className="space-y-5">
                <Field label="Job title" htmlFor="role-title">
                  <input
                    id="role-title"
                    type="text"
                    value={formData.title}
                    onChange={e => updateField('title', e.target.value)}
                    placeholder="e.g. Senior Product Designer"
                    className={fieldClass}
                  />
                </Field>

                <Field label="Sector or department">
                  <div className="flex flex-wrap gap-2">
                    {JOB_SECTORS.map(sector => (
                      <ChoiceChip
                        key={sector.id}
                        selected={formData.sector === sector.id}
                        onClick={() => updateField('sector', sector.id)}
                      >
                        {sector.label}
                      </ChoiceChip>
                    ))}
                  </div>
                </Field>

                <Field label="Location" htmlFor="role-location">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(['remote', 'hybrid', 'onsite'] as const).map(type => (
                      <ChoiceChip
                        key={type}
                        selected={formData.locationType === type}
                        onClick={() => updateField('locationType', type)}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </ChoiceChip>
                    ))}
                  </div>
                  <input
                    id="role-location"
                    type="text"
                    value={formData.location}
                    onChange={e => updateField('location', e.target.value)}
                    placeholder={
                      formData.locationType === 'remote'
                        ? 'e.g. US, Worldwide, PST timezone'
                        : 'e.g. San Francisco, CA'
                    }
                    className={fieldClass}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                  <Field label="Employment type" htmlFor="role-employment">
                    <div className="relative">
                      <select
                        id="role-employment"
                        value={formData.employmentType}
                        onChange={e => updateField('employmentType', e.target.value as RoleFormData['employmentType'])}
                        className={`${fieldClass} appearance-none pr-10 cursor-pointer`}
                      >
                        <option value="full_time">Full-time</option>
                        <option value="part_time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-textMuted)' }} />
                    </div>
                  </Field>

                  <Field label="Salary range" htmlFor="role-salary-min">
                    <div className="flex items-center gap-2">
                      <input
                        id="role-salary-min"
                        type="text"
                        value={formData.salaryMin}
                        onChange={e => updateField('salaryMin', e.target.value)}
                        placeholder="80k"
                        aria-label="Minimum salary"
                        className={fieldClass}
                      />
                      <span className="text-sm" style={{ color: 'var(--color-textMuted)' }}>to</span>
                      <input
                        type="text"
                        value={formData.salaryMax}
                        onChange={e => updateField('salaryMax', e.target.value)}
                        placeholder="120k"
                        aria-label="Maximum salary"
                        className={fieldClass}
                      />
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {step === 'details' && (
              <div className="space-y-5">
                <Field label="Role description" htmlFor="role-description">
                  <textarea
                    id="role-description"
                    value={formData.description}
                    onChange={e => updateField('description', e.target.value)}
                    placeholder="Describe the role, responsibilities, and what a typical day looks like..."
                    rows={5}
                    className={`${fieldClass} resize-none`}
                  />
                </Field>

                <Field label="Requirements" hint="One per line" htmlFor="role-requirements">
                  <textarea
                    id="role-requirements"
                    value={formData.requirements}
                    onChange={e => updateField('requirements', e.target.value)}
                    placeholder={"3+ years experience in product design\nProficiency with Figma\nStrong communication skills"}
                    rows={4}
                    className={`${fieldClass} resize-none`}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                  <Field label="Team size" htmlFor="role-team-size">
                    <input
                      id="role-team-size"
                      type="text"
                      value={formData.teamSize}
                      onChange={e => updateField('teamSize', e.target.value)}
                      placeholder="e.g. 5 people"
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Reports to" htmlFor="role-reports-to">
                    <input
                      id="role-reports-to"
                      type="text"
                      value={formData.reportingTo}
                      onChange={e => updateField('reportingTo', e.target.value)}
                      placeholder="e.g. Head of Design"
                      className={fieldClass}
                    />
                  </Field>
                </div>
              </div>
            )}

            {step === 'culture' && (
              <div>
                <p className="text-label mb-3 tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
                  {formData.preferredTraits.length} selected
                </p>
                <div className="flex flex-wrap gap-2">
                  {traitOptions.map(trait => (
                    <ChoiceChip
                      key={trait.value}
                      selected={formData.preferredTraits.includes(trait.value)}
                      onClick={() => toggleTrait(trait.value)}
                    >
                      {trait.label}
                    </ChoiceChip>
                  ))}
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="space-y-6">
                {submitError && (
                  <p role="alert" className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {submitError}
                  </p>
                )}

                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {formData.title}
                  </h3>
                  <p className="mt-0.5 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                    {sectorLabel}
                  </p>
                  <Facts
                    items={[
                      {
                        label: 'Location',
                        value: `${formData.locationType.charAt(0).toUpperCase() + formData.locationType.slice(1)} · ${formData.location}`,
                      },
                      {
                        label: 'Type',
                        value: formData.employmentType.replace('_', '-').replace(/\b\w/g, c => c.toUpperCase()),
                      },
                      ...(formData.salaryMin || formData.salaryMax
                        ? [{
                            label: 'Salary',
                            value: formData.salaryMin && formData.salaryMax
                              ? `${formData.salaryMin} – ${formData.salaryMax}`
                              : formData.salaryMin || formData.salaryMax,
                          }]
                        : []),
                      ...(formData.teamSize ? [{ label: 'Team', value: formData.teamSize }] : []),
                    ]}
                  />
                </div>

                <ReviewSection title="Description">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
                    {formData.description}
                  </p>
                </ReviewSection>

                <ReviewSection title="Requirements">
                  <ul className="list-disc pl-5 space-y-1 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                    {formData.requirements.split('\n').filter(Boolean).map((req, i) => (
                      <li key={i}>{req.trim()}</li>
                    ))}
                  </ul>
                </ReviewSection>

                <ReviewSection title="Ideal candidate traits">
                  <p className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                    {formData.preferredTraits
                      .map(trait => traitOptions.find(t => t.value === trait)?.label || trait)
                      .join(', ')}
                  </p>
                </ReviewSection>
              </div>
            )}
          </motion.section>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 'basics') navigate('/app/employer');
              else if (step === 'details') setStep('basics');
              else if (step === 'culture') setStep('details');
              else if (step === 'review') setStep('culture');
            }}
            leftIcon={step === 'basics' ? undefined : <ArrowLeft className="w-4 h-4" />}
          >
            {step === 'basics' ? 'Cancel' : 'Back'}
          </Button>

          <Button
            onClick={() => {
              if (step === 'basics') setStep('details');
              else if (step === 'details') setStep('culture');
              else if (step === 'culture') setStep('review');
              else if (step === 'review') handleSubmit();
            }}
            disabled={
              (step === 'basics' && !canProceedFromBasics) ||
              (step === 'details' && !canProceedFromDetails) ||
              (step === 'culture' && !canProceedFromCulture)
            }
            rightIcon={step === 'review' ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          >
            {step === 'review' ? 'Create role' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-label mb-1.5" style={{ color: 'var(--color-text)' }}>
        {label}
        {hint && (
          <span className="ml-1.5 font-normal" style={{ color: 'var(--color-textMuted)' }}>
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function ChoiceChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-label transition-colors',
        selected
          ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] text-[var(--color-text)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-textSecondary)] hover:border-[var(--color-borderHover)]'
      )}
    >
      {selected && <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />}
      {children}
    </button>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
      <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
