import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssessmentResultsTemplate } from './AssessmentResultsTemplate';
import { AssessmentShell, QuestionHeading, ScaleSlider, OptionList, QuestionNav } from './QuestionParts';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { cognitivePatternQuestions } from '../../data/assessmentQuestions';
import { PersonalityEngine, type OCEANScores } from '../../lib/personalityEngine';

export function CognitivePatternAssessment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success: showSuccess } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [_isSaving, setIsSaving] = useState(false);
  const [oceanScores, setOceanScores] = useState<OCEANScores | null>(null);

  const question = cognitivePatternQuestions[currentQuestion];

  const handleSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: optionId }));
  };

  const handleSliderChange = (value: number) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < cognitivePatternQuestions.length - 1) {
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

    for (const q of cognitivePatternQuestions) {
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
        await supabase
          .from('candidates')
          .update({
            cognitive_patterns_data: {
              answers,
              ocean_scores: scores,
              completed_at: new Date().toISOString(),
            },
          })
          .eq('user_id', user.id);

        showSuccess('Assessment complete!', 'Your cognitive patterns have been added to your profile.');
      } catch (err) {
        console.error('Error saving cognitive patterns data:', err);
      }
    }

    setIsSaving(false);
  };

  // Results view
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
        title="Cognitive style results"
        subtitle="Here's what your thinking style reveals about your cognitive approach"
        dimensions={dimensions}
        enhancedMessage="Your cognitive patterns have been factored into your personality profile with an 11% weight, making your matches more nuanced."
      />
    );
  }

  const sliderVal = (answers[question.id] as number) ?? 50;

  return (
    <AssessmentShell
      title="Cognitive patterns assessment"
      onExit={() => navigate('/app/insights')}
      current={currentQuestion + 1}
      total={cognitivePatternQuestions.length}
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
        isLast={currentQuestion === cognitivePatternQuestions.length - 1}
      />
    </AssessmentShell>
  );
}
