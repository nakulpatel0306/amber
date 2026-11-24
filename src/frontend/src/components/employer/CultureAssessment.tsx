import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  AssessmentShell,
  QuestionHeading,
  OptionList,
  ScaleSlider,
  QuestionNav,
  RankingQuestion,
  ReflectionQuestion,
} from '../assessments/QuestionParts';
import { useAuth, isDevMode } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { employerQuestions } from '../../data/assessmentQuestions';
import {
  cultureEngine,
  type AssessmentResponse,
} from '../../lib/personalityEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { EmployerSetupModal } from './EmployerSetupModal';

interface AssessmentState {
  currentIndex: number;
  responses: Record<string, AssessmentResponse>;
  startedAt: number;
}

export function CultureAssessment() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const [state, setState] = useState<AssessmentState>({
    currentIndex: 0,
    responses: {},
    startedAt: Date.now(),
  });

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState<number>(50);
  const [rankingOrder, setRankingOrder] = useState<string[]>([]);
  const [reflectionText, setReflectionText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile completion check
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Cooldown check (24 hours between assessments)
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [lastAssessmentAt, setLastAssessmentAt] = useState<Date | null>(null);

  const currentQuestion = employerQuestions[state.currentIndex];

  // Check if profile is complete and cooldown status before allowing assessment
  useEffect(() => {
    if (!user) return;

    const checkProfileAndCooldown = async () => {
      setIsCheckingProfile(true);
      try {
        const { data: employer } = await supabase
          .from('employers')
          .select('company_name, description, culture_quiz_completed, updated_at')
          .eq('user_id', user.id)
          .single();

        // Dev mode bypasses profile requirement
        const profileComplete = isDevMode() || !!(employer?.company_name || employer?.description);
        setHasCompletedProfile(profileComplete);

        // Check cooldown (24 hours = 86400000 ms) - only if already completed once
        if (employer?.culture_quiz_completed && employer?.updated_at) {
          const lastCompleted = new Date(employer.updated_at);
          setLastAssessmentAt(lastCompleted);
          const timeSince = Date.now() - lastCompleted.getTime();
          const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours

          if (timeSince < cooldownMs) {
            setCooldownRemaining(cooldownMs - timeSince);
          } else {
            setCooldownRemaining(null);
          }
        }
      } catch (err) {
        console.error('Error checking profile:', err);
        setHasCompletedProfile(isDevMode()); // Dev mode still works
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkProfileAndCooldown();
  }, [user]);

  // Update cooldown timer
  useEffect(() => {
    if (cooldownRemaining === null || cooldownRemaining <= 0) return;

    const interval = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev === null || prev <= 1000) {
          clearInterval(interval);
          return null;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  // Initialize ranking order when question changes
  useEffect(() => {
    if (currentQuestion?.type === 'ranking' && currentQuestion.options) {
      setRankingOrder(currentQuestion.options.map(o => o.id));
    }
  }, [state.currentIndex, currentQuestion]);

  // Load previous answer if going back
  useEffect(() => {
    const previousResponse = state.responses[currentQuestion?.id];
    if (previousResponse) {
      if (previousResponse.answerId) setSelectedAnswer(previousResponse.answerId);
      if (previousResponse.sliderValue !== undefined) setSliderValue(previousResponse.sliderValue);
      if (previousResponse.rankingOrder) setRankingOrder(previousResponse.rankingOrder);
      if (previousResponse.reflectionText) setReflectionText(previousResponse.reflectionText);
    } else {
      setSelectedAnswer(null);
      setSliderValue(50);
      setReflectionText('');
    }
  }, [state.currentIndex, currentQuestion?.id, state.responses]);

  const saveResponse = () => {
    const response: AssessmentResponse = {
      questionId: currentQuestion.id,
      timestamp: Date.now(),
    };

    if (currentQuestion.type === 'slider') {
      response.sliderValue = sliderValue;
    } else if (currentQuestion.type === 'ranking') {
      response.rankingOrder = rankingOrder;
    } else if (currentQuestion.type === 'reflection') {
      response.reflectionText = reflectionText;
    } else {
      response.answerId = selectedAnswer || undefined;
    }

    // Process response in culture engine
    cultureEngine.processResponse(response, {
      type: currentQuestion.type,
      options: currentQuestion.options,
      sliderConfig: currentQuestion.sliderConfig,
    });

    setState(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [currentQuestion.id]: response,
      },
    }));

    return response;
  };

  const handleNext = () => {
    saveResponse();

    if (state.currentIndex < employerQuestions.length - 1) {
      setState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
      setSelectedAnswer(null);
    } else {
      completeAssessment();
    }
  };

  const handlePrev = () => {
    if (state.currentIndex > 0) {
      setState(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
    }
  };

  const completeAssessment = async () => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Generate culture profile from engine
      const generatedProfile = cultureEngine.generateCultureProfile(user.id);

      // Save to database
      const { error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          user_id: user.id,
          assessment_type: 'employer_culture',
          responses: state.responses,
          started_at: new Date(state.startedAt).toISOString(),
          completed_at: new Date().toISOString(),
        });

      if (assessmentError) throw assessmentError;

      // Update employer record with culture scores
      const { error: employerError } = await supabase
        .from('employers')
        .update({
          openness_preference: generatedProfile.idealCandidateOCEAN.openness,
          conscientiousness_preference: generatedProfile.idealCandidateOCEAN.conscientiousness,
          extraversion_preference: generatedProfile.idealCandidateOCEAN.extraversion,
          agreeableness_preference: generatedProfile.idealCandidateOCEAN.agreeableness,
          neuroticism_preference: generatedProfile.idealCandidateOCEAN.neuroticism,
          culture_values: generatedProfile.valuesPriority,
          culture_quiz_completed: true,
        })
        .eq('user_id', user.id);

      if (employerError) throw employerError;

      success('Culture profile complete!', 'You can now start matching with candidates.');
      navigate('/app/employer/culture-results');
    } catch (err) {
      console.error('Assessment error:', err);
      showError('Failed to save', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (currentQuestion.type === 'slider') return true;
    if (currentQuestion.type === 'ranking') return rankingOrder.length > 0;
    if (currentQuestion.type === 'reflection') return reflectionText.trim().length > 10;
    return selectedAnswer !== null;
  };

  const handleSetupComplete = () => {
    setShowSetupModal(false);
    setHasCompletedProfile(true);
  };

  if (isCheckingProfile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <Loader2 className="w-6 h-6 spinner" style={{ color: 'var(--color-textMuted)' }} aria-label="Loading" />
      </div>
    );
  }

  if (!hasCompletedProfile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="max-w-md w-full">
          <h1 className="text-title" style={{ color: 'var(--color-text)' }}>
            Set up your company first
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            Before defining your culture, set up your company profile. It helps candidates learn about your organization.
          </p>
          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
            <Link to="/app/employer">
              <Button variant="ghost" fullWidth>
                Back to dashboard
              </Button>
            </Link>
            <Button
              onClick={() => setShowSetupModal(true)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Set up company
            </Button>
          </div>
        </div>

        <EmployerSetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onComplete={handleSetupComplete}
        />
      </div>
    );
  }

  // 24-hour wait between assessments
  if (cooldownRemaining && cooldownRemaining > 0) {
    const hours = Math.floor(cooldownRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((cooldownRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((cooldownRemaining % (1000 * 60)) / 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');

    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="max-w-md w-full">
          <h1 className="text-title" style={{ color: 'var(--color-text)' }}>
            You recently completed this
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            You can retake the culture assessment in{' '}
            <span className="font-medium tabular-nums" style={{ color: 'var(--color-text)' }}>
              {pad(hours)}:{pad(minutes)}:{pad(seconds)}
            </span>
            .
          </p>
          {lastAssessmentAt && (
            <p className="mt-2 text-sm" style={{ color: 'var(--color-textMuted)' }}>
              Last completed {lastAssessmentAt.toLocaleDateString()} at {lastAssessmentAt.toLocaleTimeString()}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
            <Link to="/app/employer/top-candidates">
              <Button variant="outline" fullWidth>
                Browse candidates
              </Button>
            </Link>
            <Link to="/app/employer/insights">
              <Button fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                View your insights
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AssessmentShell
      title="Culture assessment"
      current={state.currentIndex + 1}
      total={employerQuestions.length}
      category={currentQuestion.category}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={state.currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <QuestionHeading question={currentQuestion.question} description={currentQuestion.description} />

          {currentQuestion.type === 'scenario' || currentQuestion.type === 'metaphor' || currentQuestion.type === 'tradeoff' ? (
            <OptionList
              options={currentQuestion.options || []}
              selected={selectedAnswer}
              onSelect={setSelectedAnswer}
            />
          ) : currentQuestion.type === 'slider' ? (
            <ScaleSlider
              min={currentQuestion.sliderConfig!.min}
              max={currentQuestion.sliderConfig!.max}
              minLabel={currentQuestion.sliderConfig!.minLabel}
              maxLabel={currentQuestion.sliderConfig!.maxLabel}
              value={sliderValue}
              onChange={setSliderValue}
            />
          ) : currentQuestion.type === 'ranking' ? (
            <RankingQuestion
              options={currentQuestion.options || []}
              order={rankingOrder}
              onReorder={setRankingOrder}
            />
          ) : currentQuestion.type === 'reflection' ? (
            <ReflectionQuestion
              value={reflectionText}
              onChange={setReflectionText}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      <QuestionNav
        onBack={handlePrev}
        backDisabled={state.currentIndex === 0}
        onNext={handleNext}
        nextDisabled={!canProceed()}
        isLast={state.currentIndex === employerQuestions.length - 1}
        isLoading={isSubmitting}
        nextLabel="Continue"
      />
    </AssessmentShell>
  );
}

export default CultureAssessment;
