import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Shield,
  Palette,
  MessageSquare,
  Settings,
  Briefcase,
  Building2,
  Crown,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { PageBanner } from '../ui/PageBanner';
import { useAuth } from '../../contexts/AuthContext';

// Section components
import { ProfileSection } from './ProfileSection';
import { CandidateProfileSection } from './CandidateProfileSection';
import { EmployerProfileSection } from './EmployerProfileSection';
import { NotificationSection } from './NotificationSection';
import { PrivacySection } from './PrivacySection';
import { AppearanceSection } from './AppearanceSection';
import { FeedbackSection } from './FeedbackSection';
import { AccountSection } from './AccountSection';
import { SubscriptionSection } from './SubscriptionSection';

type SettingsSection = 'profile' | 'work-profile' | 'company-profile' | 'subscription' | 'notifications' | 'privacy' | 'appearance' | 'feedback' | 'account';

interface SectionConfig {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
  description: string;
  candidateOnly?: boolean;
  employerOnly?: boolean;
}

const allSections: SectionConfig[] = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Your personal information' },
  { id: 'work-profile', label: 'Work profile', icon: Briefcase, description: 'Job preferences and experience', candidateOnly: true },
  { id: 'company-profile', label: 'Company profile', icon: Building2, description: 'Company information', employerOnly: true },
  { id: 'subscription', label: 'Subscription', icon: Crown, description: 'Plan and billing' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email and push preferences' },
  { id: 'privacy', label: 'Privacy', icon: Shield, description: 'Control your visibility' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme and display' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, description: 'Report bugs or suggest ideas' },
  { id: 'account', label: 'Account', icon: Settings, description: 'Password and security' },
];

export function SettingsPage() {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const { isCandidate, isEmployer } = useAuth();

  const activeSection = (section as SettingsSection) || 'profile';

  // Filter sections based on user role
  const sections = allSections.filter(s => {
    if (s.candidateOnly && !isCandidate) return false;
    if (s.employerOnly && !isEmployer) return false;
    return true;
  });

  const handleSectionChange = (newSection: SettingsSection) => {
    navigate(`/app/settings/${newSection}`);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'work-profile':
        return isCandidate ? <CandidateProfileSection /> : <ProfileSection />;
      case 'company-profile':
        return isEmployer ? <EmployerProfileSection /> : <ProfileSection />;
      case 'subscription':
        return <SubscriptionSection />;
      case 'notifications':
        return <NotificationSection />;
      case 'privacy':
        return <PrivacySection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'feedback':
        return <FeedbackSection />;
      case 'account':
        return <AccountSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageBanner title="Settings" subtitle="Manage your account and preferences" />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar navigation */}
        <nav className="md:w-64 flex-shrink-0">
          <ul className="space-y-1">
            {sections.map(({ id, label, icon: Icon, description }) => (
              <li key={id}>
                <button
                  onClick={() => handleSectionChange(id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'text-left transition-all'
                  )}
                  style={{
                    backgroundColor:
                      activeSection === id
                        ? 'var(--color-surfaceHover)'
                        : 'transparent',
                    color:
                      activeSection === id
                        ? 'var(--color-text)'
                        : 'var(--color-textSecondary)',
                  }}
                >
                  <Icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{
                      color: activeSection === id
                        ? 'var(--color-accent)'
                        : 'var(--color-textMuted)',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: 'var(--color-textMuted)' }}
                    >
                      {description}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <div
            className="p-6 rounded-2xl border"
            style={{
              backgroundColor: 'var(--color-backgroundSecondary)',
              borderColor: 'var(--color-border)',
            }}
          >
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}
