import { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { QuestionProgress, QuestionHeading, OptionCard } from '../assessments/QuestionParts';
import {
  startAssessment,
  submitAnswer,
  getAssessmentResults,
  type Question,
  type AssessmentResults,
} from '../../utils/api';

type AssessmentState = 'welcome' | 'assessment' | 'halfway' | 'calculating' | 'results';

interface AssessmentStep {
  questionId: number;
  answered: boolean;
}

const fieldClass =
  'w-full px-3 py-2.5 rounded-lg border text-sm bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] placeholder:text-[var(--color-textMuted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]';

export function AssessmentFlow() {
  const [state, setState] = useState<AssessmentState>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [steps, setSteps] = useState<AssessmentStep[]>([]);
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleStartAssessment = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Please enter your name and email.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await startAssessment({ name: name.trim(), email: email.trim() });
      setCandidateId(response.candidate_id);
      setCurrentQuestion(response.question);
      setCurrentQuestionNumber(response.current_question);
      setTotalQuestions(response.total_questions);

      // Initialize steps
      const initialSteps = Array.from({ length: response.total_questions }, (_, i) => ({
        questionId: i + 1,
        answered: i + 1 < response.current_question,
      }));
      setSteps(initialSteps);

      setState('assessment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start the assessment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!candidateId || !currentQuestion) return;

    setSelectedAnswer(answer);
    setIsLoading(true);
    setError(null);

    try {
      const response = await submitAnswer({
        candidate_id: candidateId,
        question_id: currentQuestion.id,
        answer,
      });

      // Update steps
      setSteps(prev =>
        prev.map(step =>
          step.questionId === currentQuestion.id ? { ...step, answered: true } : step
        )
      );

      if (response.is_complete) {
        setState('calculating');
        // Simulate calculation time
        setTimeout(async () => {
          try {
            const assessmentResults = await getAssessmentResults(candidateId);
            setResults(assessmentResults);
            setState('results');
          } catch {
            setError('Failed to get results.');
            setState('assessment');
          }
        }, 2000);
      } else if (response.message.includes('halfway')) {
        setCurrentQuestion(response.next_question);
        setCurrentQuestionNumber(response.current_question);
        setState('halfway');
      } else {
        setCurrentQuestion(response.next_question);
        setCurrentQuestionNumber(response.current_question);
        setSelectedAnswer(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit your answer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    setState('assessment');
    setSelectedAnswer(null);
  };

  const errorMessage = error && (
    <p role="alert" className="mb-4 text-sm" style={{ color: 'var(--color-error)' }}>
      {error}
    </p>
  );

  if (state === 'welcome') {
    return (
      <div className="min-h-full px-4 sm:px-6 py-12">
        <div className="w-full max-w-md mx-auto">
          <h1 className="text-title" style={{ color: 'var(--color-text)' }}>
            Culture fit assessment
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            A few short questions about how you like to work. It takes about five minutes.
          </p>

          <div className="mt-8 space-y-4">
            {errorMessage}
            <div>
              <label htmlFor="af-name" className="block text-label mb-1.5" style={{ color: 'var(--color-text)' }}>
                Your name
              </label>
              <input
                id="af-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="af-email" className="block text-label mb-1.5" style={{ color: 'var(--color-text)' }}>
                Email address
              </label>
              <input
                id="af-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className={fieldClass}
              />
            </div>
            <Button
              onClick={handleStartAssessment}
              isLoading={isLoading}
              fullWidth
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'halfway') {
    const answered = steps.filter(step => step.answered).length;
    return (
      <div className="min-h-full px-4 sm:px-6 py-12">
        <div className="w-full max-w-md mx-auto">
          <QuestionProgress current={answered} total={totalQuestions} />
          <h2 className="mt-8 text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
            You're halfway there
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            Just 5 more questions to go.
          </p>
          <Button className="mt-6" onClick={handleContinue} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'calculating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-4 sm:px-6 py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 spinner" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
            Calculating your fit score
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            Analyzing your responses
          </p>
        </div>
      </div>
    );
  }

  if (state === 'results' && results) {
    return (
      <div className="min-h-full px-4 sm:px-6 py-12">
        <div className="w-full max-w-md mx-auto">
          <h1 className="text-title" style={{ color: 'var(--color-text)' }}>
            Assessment complete
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            Here's your culture fit score.
          </p>

          <div className="bento-card mt-8">
            <p className="text-label" style={{ color: 'var(--color-textSecondary)' }}>
              Culture fit
            </p>
            <p className="mt-1 text-title tabular-nums" style={{ color: 'var(--color-text)' }}>
              {results.culture_fit_score}
              <span className="text-base font-normal" style={{ color: 'var(--color-textMuted)' }}>/100</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-textSecondary)' }}>
              {results.explanation}
            </p>

            <div className="mt-6 pt-5 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
              <ScoreBar label="Work style" score={results.work_style_score} />
              <ScoreBar label="Communication" score={results.communication_score} />
              <ScoreBar label="Values" score={results.values_score} />
            </div>

            <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Your top traits
              </h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                {results.top_traits.join(', ')}
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm" style={{ color: 'var(--color-textMuted)' }}>
            We'll be in touch soon with next steps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 sm:px-6 py-8">
      <div className="w-full max-w-2xl mx-auto">
        <QuestionProgress current={currentQuestionNumber} total={totalQuestions} />

        <div className="mt-8">
          {errorMessage}
          {currentQuestion && (
            <>
              <QuestionHeading question={currentQuestion.question} />
              {/* A fieldset disables every option at once while an answer is in flight */}
              <fieldset disabled={isLoading} className="space-y-3 disabled:opacity-60">
                {currentQuestion.options.map((option, i) => (
                  <OptionCard
                    key={i}
                    selected={selectedAnswer === option}
                    onSelect={() => handleSubmitAnswer(option)}
                    text={option}
                  />
                ))}
              </fieldset>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-sm">
        <span style={{ color: 'var(--color-textSecondary)' }}>{label}</span>
        <span className="font-medium tabular-nums" style={{ color: 'var(--color-text)' }}>
          {score}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: 'var(--color-accent)' }} />
      </div>
    </div>
  );
}
