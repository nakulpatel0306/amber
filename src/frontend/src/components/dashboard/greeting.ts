import { IS_DEMO } from '../../demo/flag';

export function timeOfDayGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** First name for the greeting, or '' to greet without one. */
export function greetingFirstName(fullName: string | null | undefined): string {
  // The demo account is always the generic "Demo Visitor"; "Good morning, Demo" reads as a glitch
  if (IS_DEMO) return '';
  return fullName?.trim().split(/\s+/)[0] ?? '';
}
