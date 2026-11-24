import { CoffeeChatData } from './CoffeeChatCard';

interface CoffeeChatFollowUpProps {
  chat: CoffeeChatData;
}

interface FollowUpConfig {
  header: string;
  subheader: string;
  suggestions: string[];
}

function getFollowUpConfig(rating: number): FollowUpConfig {
  if (rating >= 4) {
    return {
      header: 'Strong connection',
      subheader: 'Next steps',
      suggestions: [
        'Consider moving to a formal interview',
        'Schedule a follow-up to discuss the role in depth',
        'Share this match with your hiring team',
      ],
    };
  }

  if (rating === 3) {
    return {
      header: 'Worth another look',
      subheader: 'Consider these factors',
      suggestions: [
        'Reflect on what aspects felt aligned',
        'Think about whether the gaps are dealbreakers',
        'A second conversation might reveal more',
      ],
    };
  }

  return {
    header: 'Other options',
    subheader: 'Explore these instead',
    suggestions: [
      'Check your other high-scoring matches',
      'Consider what made this one feel off',
      'Sometimes personality differences become strengths over time',
    ],
  };
}

// Rendered inside the chat card as a divided section, not a tinted card of its own
export function CoffeeChatFollowUp({ chat }: CoffeeChatFollowUpProps) {
  if (chat.status !== 'completed' || chat.rating == null) {
    return null;
  }

  const config = getFollowUpConfig(chat.rating);

  return (
    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
      <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        {config.header}
      </h4>
      <p className="text-label font-normal mt-0.5 mb-2" style={{ color: 'var(--color-textMuted)' }}>
        {config.subheader}
      </p>
      <ul className="space-y-1.5">
        {config.suggestions.map(text => (
          <li key={text} className="flex items-start gap-2 text-sm">
            <span
              className="flex-shrink-0 w-1 h-1 rounded-full mt-2"
              style={{ backgroundColor: 'var(--color-textMuted)' }}
            />
            <span style={{ color: 'var(--color-textSecondary)' }}>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
