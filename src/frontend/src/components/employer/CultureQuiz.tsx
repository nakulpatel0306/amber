import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { AssessmentShell, QuestionHeading, OptionList, QuestionNav } from '../assessments/QuestionParts';

interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  options: {
    value: string;
    label: string;
    description: string;
  }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'work-style',
    category: 'Work style',
    question: 'How would you describe your team\'s work style?',
    options: [
      { value: 'structured', label: 'Structured and planned', description: 'Clear processes, defined roles, predictable schedules' },
      { value: 'flexible', label: 'Flexible and adaptive', description: 'Agile approach, shifting priorities, autonomy in methods' },
      { value: 'collaborative', label: 'Highly collaborative', description: 'Lots of meetings, pair work, group decisions' },
      { value: 'independent', label: 'Independent and focused', description: 'Deep work time, minimal meetings, async communication' },
    ],
  },
  {
    id: 'communication',
    category: 'Communication',
    question: 'What\'s your preferred communication style?',
    options: [
      { value: 'sync', label: 'Real-time and synchronous', description: 'Quick calls, instant messaging, immediate responses' },
      { value: 'async', label: 'Asynchronous first', description: 'Thoughtful docs, scheduled meetings, flexible response times' },
      { value: 'formal', label: 'Formal and documented', description: 'Written records, clear chains, structured updates' },
      { value: 'casual', label: 'Casual and open', description: 'Informal chats, open door policy, spontaneous discussions' },
    ],
  },
  {
    id: 'decision-making',
    category: 'Decision making',
    question: 'How are decisions typically made?',
    options: [
      { value: 'consensus', label: 'Team consensus', description: 'Everyone has input, decisions made together' },
      { value: 'leadership', label: 'Leadership driven', description: 'Managers decide, team executes' },
      { value: 'data', label: 'Data informed', description: 'Metrics and analysis drive choices' },
      { value: 'expert', label: 'Expert ownership', description: 'Domain experts make calls in their area' },
    ],
  },
  {
    id: 'growth',
    category: 'Growth and learning',
    question: 'How do you support employee growth?',
    options: [
      { value: 'mentorship', label: 'Mentorship focused', description: 'Senior guidance, 1:1 coaching, shadowing' },
      { value: 'self-directed', label: 'Self-directed learning', description: 'Learning budgets, time for exploration, choose your path' },
      { value: 'structured', label: 'Structured programs', description: 'Defined tracks, certifications, formal training' },
      { value: 'experiential', label: 'Learn by doing', description: 'Stretch assignments, new challenges, fail-fast culture' },
    ],
  },
  {
    id: 'feedback',
    category: 'Feedback culture',
    question: 'How does feedback flow in your organization?',
    options: [
      { value: 'continuous', label: 'Continuous and informal', description: 'Real-time feedback, casual check-ins' },
      { value: 'scheduled', label: 'Scheduled reviews', description: 'Quarterly or annual formal reviews' },
      { value: 'peer', label: 'Peer-driven', description: '360 feedback, team retrospectives' },
      { value: 'metrics', label: 'Metrics based', description: 'OKRs, KPIs, performance dashboards' },
    ],
  },
  {
    id: 'values',
    category: 'Core values',
    question: 'Which value resonates most with your culture?',
    options: [
      { value: 'innovation', label: 'Innovation and creativity', description: 'Pushing boundaries, trying new things' },
      { value: 'reliability', label: 'Reliability and trust', description: 'Consistency, dependability, keeping promises' },
      { value: 'speed', label: 'Speed and agility', description: 'Moving fast, iterating quickly, bias for action' },
      { value: 'quality', label: 'Quality and excellence', description: 'High standards, attention to detail, craftsmanship' },
    ],
  },
  {
    id: 'work-life',
    category: 'Work-life balance',
    question: 'What\'s your approach to work-life balance?',
    options: [
      { value: 'flexible', label: 'Highly flexible', description: 'Work when you want, unlimited PTO, trust-based' },
      { value: 'balanced', label: 'Structured balance', description: 'Clear hours, protected time off, boundaries respected' },
      { value: 'intensive', label: 'Intensive periods', description: 'Crunch times exist but are followed by recovery' },
      { value: 'integrated', label: 'Work-life integration', description: 'Blur between work and life, always connected but flexible' },
    ],
  },
  {
    id: 'team-dynamic',
    category: 'Team dynamics',
    question: 'How would you describe your team dynamics?',
    options: [
      { value: 'competitive', label: 'Friendly competition', description: 'Leaderboards, recognition, healthy rivalry' },
      { value: 'supportive', label: 'Deeply supportive', description: 'Help each other, celebrate together, no blame' },
      { value: 'professional', label: 'Professionally friendly', description: 'Respectful, cordial, work-focused relationships' },
      { value: 'social', label: 'Close-knit social', description: 'Friendships, team outings, personal connections' },
    ],
  },
];

type QuizState = 'intro' | 'questions' | 'saving' | 'complete';

export function CultureQuiz() {
  const navigate = useNavigate();
  const [state, setState] = useState<QuizState>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = quizQuestions[currentIndex];
  const isComplete = Object.keys(answers).length === quizQuestions.length;

  const handleSelectAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (isComplete) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setState('saving');
    // TODO: Save to API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setState('complete');
  };

  if (state === 'intro') {
    return (
      <div className="min-h-full px-4 sm:px-6 py-12">
        <div className="w-full max-w-lg mx-auto">
          <h1 className="text-title" style={{ color: 'var(--color-text)' }}>
            Define your company culture
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            Answer {quizQuestions.length} questions about how your team works, communicates and grows, so we can match
            you with candidates who'll thrive there. It takes about 3 minutes.
          </p>
          <Button className="mt-6" onClick={() => setState('questions')} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Start quiz
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'saving') {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-4 sm:px-6 py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
            Saving your culture profile
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            Analyzing your preferences
          </p>
        </div>
      </div>
    );
  }

  if (state === 'complete') {
    const highlights = Object.entries(answers)
      .slice(0, 4)
      .map(([questionId, value]) =>
        quizQuestions.find(q => q.id === questionId)?.options.find(o => o.value === value)?.label ?? value
      );

    return (
      <div className="min-h-full px-4 sm:px-6 py-12">
        <div className="w-full max-w-lg mx-auto">
          <h1 className="text-title" style={{ color: 'var(--color-text)' }}>
            Culture profile complete
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
            We'll use this to match you with candidates who fit your culture.
          </p>

          <div className="bento-card mt-8">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Your culture highlights
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
              {highlights.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => navigate('/app/employer')}>
              Back to dashboard
            </Button>
            <Button onClick={() => navigate('/app/employer/roles/new')} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Create your first role
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AssessmentShell
      title="Company culture"
      current={currentIndex + 1}
      total={quizQuestions.length}
      category={currentQuestion.category}
    >
      <QuestionHeading question={currentQuestion.question} />
      <OptionList
        options={currentQuestion.options.map(o => ({ id: o.value, text: o.label, description: o.description }))}
        selected={answers[currentQuestion.id]}
        onSelect={value => handleSelectAnswer(currentQuestion.id, value)}
      />
      <QuestionNav
        onBack={handleBack}
        backDisabled={currentIndex === 0}
        onNext={handleNext}
        nextDisabled={!answers[currentQuestion.id]}
        isLast={currentIndex === quizQuestions.length - 1}
      />
    </AssessmentShell>
  );
}
