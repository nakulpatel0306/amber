import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { candidateQuestions } from '../../data/assessmentQuestions';
import {
  personalityEngine,
  type AssessmentResponse,
  type CandidateProfile,
} from '../../lib/personalityEngine';
import { determineArchetype } from '../../lib/archetypes';
import { CandidateSetupModal } from './CandidateSetupModal';

interface AssessmentState {
  currentIndex: number;
  responses: Record<string, AssessmentResponse>;
  startedAt: number;
  assessmentId: string | null;
}

export function Assessment() {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();

  const [state, setState] = useState<AssessmentState>({
    currentIndex: 0,
    responses: {},
    startedAt: Date.now(),
    assessmentId: null,
  });

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState<number>(50);
  const [rankingOrder, setRankingOrder] = useState<string[]>([]);
  const [reflectionText, setReflectionText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);

  // Profile completion check
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const currentQuestion = candidateQuestions[state.currentIndex];

  // Check if profile is complete and cooldown status before allowing assessment
  useEffect(() => {
    if (!user) return;

    const checkProfile = async () => {
      setIsCheckingProfile(true);
      try {
        const { data: candidate } = await supabase
          .from('candidates')
          .select('headline, bio, location, years_experience, preferred_work_style, preferred_company_size')
          .eq('user_id', user.id)
          .single();

        // All mandatory fields must be filled (everything except salary expectations and links)
        const profileComplete = isDevMode() || !!(
          candidate?.headline &&
          candidate?.bio &&
          candidate?.location &&
          candidate?.years_experience !== null &&
          candidate?.preferred_work_style &&
          candidate?.preferred_company_size
        );
        setHasCompletedProfile(profileComplete);
      } catch (err) {
        console.error('Error checking profile:', err);
        setHasCompletedProfile(isDevMode()); // Dev mode still works
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkProfile();
  }, [user]);

  // Initialize or resume assessment session
  useEffect(() => {
    if (!user || !hasCompletedProfile || isCheckingProfile) return;

    const initializeAssessment = async () => {
      try {
        // Check for existing in-progress assessment
        const { data: existingAssessment } = await supabase
          .from('assessments')
          .select('id, started_at')
          .eq('user_id', user.id)
          .eq('assessment_type', 'candidate_personality')
          .is('completed_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingAssessment) {
          // Resume existing assessment - load saved responses
          const { data: savedResponses } = await supabase
            .from('assessment_responses')
            .select('*')
            .eq('assessment_id', existingAssessment.id);

          if (savedResponses && savedResponses.length > 0) {
            // Convert saved responses to the format expected by the component
            const responses: Record<string, AssessmentResponse> = {};
            let lastAnsweredIndex = -1;

            savedResponses.forEach((r) => {
              const questionId = r.question_code;
              const answer = r.answer as { value?: number; selected?: string; order?: string[]; text?: string } | null;

              const response: AssessmentResponse = {
                questionId,
                timestamp: new Date(r.answered_at).getTime(),
              };

              // Extract answer from JSONB based on answer type
              if (answer) {
                if (answer.value !== undefined) response.sliderValue = answer.value;
                if (answer.selected) response.answerId = answer.selected;
                if (answer.order) response.rankingOrder = answer.order;
                if (answer.text) response.reflectionText = answer.text;
              }

              responses[questionId] = response;

              // Process in personality engine
              const question = candidateQuestions.find(q => q.id === questionId);
              if (question) {
                personalityEngine.processResponse(response, {
                  type: question.type,
                  options: question.options,
                  sliderConfig: question.sliderConfig,
                });
                const questionIndex = candidateQuestions.findIndex(q => q.id === questionId);
                if (questionIndex > lastAnsweredIndex) {
                  lastAnsweredIndex = questionIndex;
                }
              }
            });

            setState(prev => ({
              ...prev,
              assessmentId: existingAssessment.id,
              responses,
              startedAt: new Date(existingAssessment.started_at).getTime(),
              currentIndex: Math.min(lastAnsweredIndex + 1, candidateQuestions.length - 1),
            }));
          } else {
            setState(prev => ({
              ...prev,
              assessmentId: existingAssessment.id,
              startedAt: new Date(existingAssessment.started_at).getTime(),
            }));
          }
        } else {
          // Create new assessment session
          const { data: newAssessment, error } = await supabase
            .from('assessments')
            .insert({
              user_id: user.id,
              assessment_type: 'candidate_personality',
              started_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (error) throw error;

          setState(prev => ({
            ...prev,
            assessmentId: newAssessment.id,
          }));
        }
      } catch (err) {
        console.error('Error initializing assessment:', err);
      }
    };

    initializeAssessment();
  }, [user, hasCompletedProfile, isCheckingProfile]);

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

  // Redirect to results page after completion
  // NOTE: This hook must be before any conditional returns to maintain consistent hook order
  useEffect(() => {
    if (isComplete && profile) {
      navigate('/app/personality/results');
    }
  }, [isComplete, profile, navigate]);

  const saveResponse = async () => {
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

    // Process response in engine
    personalityEngine.processResponse(response, {
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

    // Save response to database incrementally
    if (state.assessmentId && user) {
      try {
        // Build JSONB answer based on question type
        let answer: Record<string, unknown>;
        if (response.sliderValue !== undefined) {
          answer = { value: response.sliderValue };
        } else if (response.rankingOrder) {
          answer = { order: response.rankingOrder };
        } else if (response.reflectionText) {
          answer = { text: response.reflectionText };
        } else if (response.answerId) {
          answer = { selected: response.answerId };
        } else {
          answer = {};
        }

        await supabase
          .from('assessment_responses')
          .upsert({
            assessment_id: state.assessmentId,
            user_id: user.id,
            question_code: currentQuestion.id,
            answer,
            answered_at: new Date().toISOString(),
          }, {
            onConflict: 'assessment_id,question_code',
          });
      } catch (err) {
        console.error('Error saving response:', err);
      }
    }

    return response;
  };

  const handleNext = async () => {
    await saveResponse();

    if (state.currentIndex < candidateQuestions.length - 1) {
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
    if (!user || !state.assessmentId) return;

    setIsSubmitting(true);

    try {
      // Generate profile from engine
      const generatedProfile = personalityEngine.generateCandidateProfile(user.id);
      setProfile(generatedProfile);

      // Update assessment record with final responses and completion time
      const { error: assessmentError } = await supabase
        .from('assessments')
        .update({
          responses: state.responses,
          completed_at: new Date().toISOString(),
        })
        .eq('id', state.assessmentId);

      if (assessmentError) throw assessmentError;

      // The dashboard reads top_traits[0] as the archetype, so lead with the
      // one the Ember engine assigns; constellations follow as extra traits.
      const archetypeName = determineArchetype(generatedProfile.ocean).name;
      const topTraits = [
        archetypeName,
        ...generatedProfile.constellations.map(c => c.name).filter(name => name !== archetypeName),
      ];

      // Update candidate record with scores
      const { error: candidateError } = await supabase
        .from('candidates')
        .update({
          openness_score: generatedProfile.ocean.openness,
          conscientiousness_score: generatedProfile.ocean.conscientiousness,
          extraversion_score: generatedProfile.ocean.extraversion,
          agreeableness_score: generatedProfile.ocean.agreeableness,
          neuroticism_score: generatedProfile.ocean.neuroticism,
          top_traits: topTraits,
          assessment_status: 'completed',
          assessment_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (candidateError) throw candidateError;

      setIsComplete(true);
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
            Complete your profile first
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            Before taking the personality assessment, set up your candidate profile. It helps us match you with the right opportunities.
          </p>
          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
            <Link to="/app/dashboard">
              <Button variant="ghost" fullWidth>
                Back to dashboard
              </Button>
            </Link>
            <Button
              onClick={() => setShowSetupModal(true)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Set up profile
            </Button>
          </div>
        </div>

        <CandidateSetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onComplete={handleSetupComplete}
          redirectToAssessment={false}
        />
      </div>
    );
  }

  if (isComplete && profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="text-center">
          <Loader2 className="w-6 h-6 mx-auto mb-3 spinner" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            Generating your personality profile
          </p>
        </div>
      </div>
    );
  }

  const isLast = state.currentIndex === candidateQuestions.length - 1;

  return (
    <AssessmentShell
      title="Personality assessment"
      current={state.currentIndex + 1}
      total={candidateQuestions.length}
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
        isLast={isLast}
        isLoading={isSubmitting}
        nextLabel="Continue"
      />
    </AssessmentShell>
  );
}

export default Assessment;
