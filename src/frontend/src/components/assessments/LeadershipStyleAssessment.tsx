import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssessmentResultsTemplate } from './AssessmentResultsTemplate';
import { AssessmentShell, QuestionHeading, ScaleSlider, OptionList, QuestionNav } from './QuestionParts';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { leadershipStyleQuestions } from '../../data/assessmentQuestions';
import { PersonalityEngine, type OCEANScores } from '../../lib/personalityEngine';

export function LeadershipStyleAssessment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success: showSuccess } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [_isSaving, setIsSaving] = useState(false);
  const [oceanScores, setOceanScores] = useState<OCEANScores | null>(null);

  const question = leadershipStyleQuestions[currentQuestion];

  const handleSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: optionId }));
  };

  const handleSliderChange = (value: number) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < leadershipStyleQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsComplete(true);
    setIsSaving(true);

    const engine = new PersonalityEngine();

    for (const q of leadershipStyleQuestions) {
      const answer = answers[q.id];
      if (answer === undefined) continue;

      if (q.type === 'slider') {
        engine.processResponse(
          { questionId: q.id, sliderValue: answer as number, timestamp: Date.now() },
          { type: q.type, sliderConfig: q.sliderConfig }
        );
      } else {
        engine.processResponse(
          { questionId: q.id, answerId: answer as string, timestamp: Date.now() },
          { type: q.type, options: q.options }
        );
      }
    }

    const scores = engine.calculateOCEAN();
    setOceanScores(scores);

    if (user) {
      try {
        // 1. Create assessment record
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .insert({
            user_id: user.id,
            assessment_type: 'leadership_style',
            responses: answers,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (assessmentError) {
          console.error('Error creating assessment record:', assessmentError);
        }

        // 2. Save individual answers to assessment_responses
        if (assessmentData) {
          const responseRecords = Object.entries(answers).map(([questionCode, answer]) => ({
            assessment_id: assessmentData.id,
            user_id: user.id,
            question_code: questionCode,
            answer: typeof answer === 'number' ? { value: answer } : { selected: answer },
          }));

          const { error: responsesError } = await supabase
            .from('assessment_responses')
            .insert(responseRecords);

          if (responsesError) {
            console.error('Error saving assessment responses:', responsesError);
          }
        }

        // 3. Update employer's JSONB column for easy access
        await supabase
          .from('employers')
          .update({
            leadership_style_data: {
              answers,
              ocean_scores: scores,
              completed_at: new Date().toISOString(),
            },
          })
          .eq('user_id', user.id);

        showSuccess('Assessment complete!', 'Your leadership style profile has been added.');
      } catch (err) {
        console.error('Error saving leadership style data:', err);
      }
    }

    setIsSaving(false);
  };

  if (isComplete && oceanScores) {
    const dimensions = [
      { key: 'openness', label: 'Openness', value: oceanScores.openness },
      { key: 'conscientiousness', label: 'Conscientiousness', value: oceanScores.conscientiousness },
      { key: 'extraversion', label: 'Extraversion', value: oceanScores.extraversion },
      { key: 'agreeableness', label: 'Agreeableness', value: oceanScores.agreeableness },
      { key: 'neuroticism', label: 'Emotional stability', value: 100 - oceanScores.neuroticism },
    ];

    return (
      <AssessmentResultsTemplate
        title="Leadership and management results"
        subtitle="Here's how your management philosophy shapes the candidates you attract"
        dimensions={dimensions}
        enhancedMessage="Your leadership style has been factored into your culture profile with a 12% weight, making your candidate matches more accurate."
        profileUrl="/app/employer/insights"
        matchesUrl="/app/employer/top-candidates"
        profileLabel="View culture profile"
        matchesLabel="Browse candidates"
      />
    );
  }

  const sliderVal = (answers[question.id] as number) ?? 50;

  return (
    <AssessmentShell
      title="Leadership and management"
      onExit={() => navigate('/app/employer/insights')}
      current={currentQuestion + 1}
      total={leadershipStyleQuestions.length}
      category={question.category}
    >
      <QuestionHeading question={question.question} description={question.description} />

      {question.type === 'slider' && question.sliderConfig && (
        <ScaleSlider
          min={question.sliderConfig.min}
          max={question.sliderConfig.max}
          minLabel={question.sliderConfig.minLabel}
          maxLabel={question.sliderConfig.maxLabel}
          value={sliderVal}
          onChange={handleSliderChange}
        />
      )}

      {question.options && (
        <OptionList
          options={question.options}
          selected={answers[question.id] as string | undefined}
          onSelect={handleSelect}
        />
      )}

      <QuestionNav
        onBack={handleBack}
        backDisabled={currentQuestion === 0}
        onNext={handleNext}
        nextDisabled={answers[question.id] === undefined}
        isLast={currentQuestion === leadershipStyleQuestions.length - 1}
      />
    </AssessmentShell>
  );
}
