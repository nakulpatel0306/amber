import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { supabase } from '../../lib/supabase';
import { determineArchetype } from '../../lib/archetypes';
import type { OCEANScores } from '../../lib/compatibilityScoring';
import { getHobbyById } from '../../data/hobbies';

interface EmployerDetails {
  id: string;
  company_name: string;
  description: string;
  industry: string;
  company_size: string;
  location: string;
  company_website: string | null;
  culture_values: string[];
  openness_preference: number;
  conscientiousness_preference: number;
  extraversion_preference: number;
  agreeableness_preference: number;
  neuroticism_preference: number;
}

interface RoleDetails {
  id: string;
  title: string;
  description: string;
  location: string;
  work_style: string | null;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
}

interface CandidateDetails {
  id: string;
  user_id: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  preferred_work_style: string | null;
  openness_score: number;
  conscientiousness_score: number;
  extraversion_score: number;
  agreeableness_score: number;
  neuroticism_score: number;
  top_traits: string[];
  hobbies: string[];
  catalog_photos: string[];
  profile?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface CoffeeChatDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  coffeeChatId?: string; // For future use
  viewerRole: 'candidate' | 'employer';
  partnerId: string; // employer_id for candidates, candidate_id for employers
  partnerName: string;
  matchScore?: number;
  onMessage?: () => void;
  onFeedback?: () => void;
}

export function CoffeeChatDetailModal({
  isOpen,
  onClose,
  viewerRole,
  partnerId,
  partnerName,
  matchScore,
  onMessage,
  onFeedback,
}: CoffeeChatDetailModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [employerDetails, setEmployerDetails] = useState<EmployerDetails | null>(null);
  const [roles, setRoles] = useState<RoleDetails[]>([]);
  const [candidateDetails, setCandidateDetails] = useState<CandidateDetails | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadDetails();
  }, [isOpen, partnerId, viewerRole]);

  const loadDetails = async () => {
    setIsLoading(true);
    try {
      if (viewerRole === 'candidate') {
        // Load employer details and their roles via RPC (bypasses RLS safely)
        const { data, error } = await supabase
          .rpc('get_employer_with_roles', { employer_uuid: partnerId });

        if (!error && data) {
          if (data.employer) {
            setEmployerDetails(data.employer);
          }
          if (data.roles) {
            setRoles(data.roles);
          }
        }
      } else {
        // Load candidate details
        const { data: candidate } = await supabase
          .from('candidates')
          .select('id, user_id, headline, bio, location, preferred_work_style, openness_score, conscientiousness_score, extraversion_score, agreeableness_score, neuroticism_score, top_traits, hobbies, catalog_photos')
          .eq('id', partnerId)
          .single();

        if (candidate) {
          // Try to get profile info
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('id', candidate.user_id)
            .single();

          setCandidateDetails({
            ...candidate,
            hobbies: candidate.hobbies || [],
            catalog_photos: candidate.catalog_photos || [],
            profile: profile || undefined,
          });
        }
      }
    } catch (err) {
      console.error('Error loading details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    const format = (n: number) => `$${(n / 1000).toFixed(0)}k`;
    if (min && max) return `${format(min)} – ${format(max)}`;
    if (min) return `From ${format(min)}`;
    if (max) return `Up to ${format(max)}`;
    return null;
  };

  const getCandidateArchetype = () => {
    if (!candidateDetails) return null;
    const ocean: OCEANScores = {
      openness: candidateDetails.openness_score || 50,
      conscientiousness: candidateDetails.conscientiousness_score || 50,
      extraversion: candidateDetails.extraversion_score || 50,
      agreeableness: candidateDetails.agreeableness_score || 50,
      neuroticism: candidateDetails.neuroticism_score || 50,
    };
    return determineArchetype(ocean);
  };

  const meta = (items: (string | null | undefined | false)[]) => items.filter(Boolean).join(' · ');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <div className="relative">
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between gap-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="min-w-0">
            <h2 className="text-heading truncate" style={{ color: 'var(--color-text)' }}>
              {partnerName}
            </h2>
            {matchScore != null && matchScore > 0 && (
              <p className="text-label font-normal tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
                {matchScore}% match
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg transition-colors hover:bg-[var(--color-surface)] flex-shrink-0"
            style={{ color: 'var(--color-textMuted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: plain sections separated by spacing, no boxes inside the modal */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-accent)] border-t-transparent" />
            </div>
          ) : viewerRole === 'candidate' && employerDetails ? (
            <div className="space-y-6">
              <Section title="Company overview">
                {employerDetails.description && (
                  <p className="text-sm mb-2" style={{ color: 'var(--color-textSecondary)' }}>
                    {employerDetails.description}
                  </p>
                )}
                <p className="text-label font-normal" style={{ color: 'var(--color-textMuted)' }}>
                  {meta([
                    employerDetails.industry,
                    employerDetails.company_size && `${employerDetails.company_size} employees`,
                    employerDetails.location,
                  ])}
                  {employerDetails.company_website && (
                    <>
                      {' · '}
                      <a
                        href={employerDetails.company_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline underline-offset-4"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        Website
                      </a>
                    </>
                  )}
                </p>
              </Section>

              {employerDetails.culture_values && employerDetails.culture_values.length > 0 && (
                <Section title="Culture values">
                  <TagList items={employerDetails.culture_values} />
                </Section>
              )}

              {roles.length > 0 && (
                <Section title="Open roles" count={roles.length}>
                  <ul>
                    {roles.map((role, i) => (
                      <li
                        key={role.id}
                        className="py-3"
                        style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : undefined }}
                      >
                        <h4 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          {role.title}
                        </h4>
                        {role.description && (
                          <p className="text-sm mt-0.5 line-clamp-2" style={{ color: 'var(--color-textSecondary)' }}>
                            {role.description}
                          </p>
                        )}
                        <p className="text-label font-normal mt-1 tabular-nums" style={{ color: 'var(--color-textMuted)' }}>
                          {meta([role.location, role.work_style, role.employment_type, formatSalary(role.salary_min, role.salary_max)])}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          ) : viewerRole === 'employer' && candidateDetails ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar
                  src={candidateDetails.profile?.avatar_url}
                  fallback={candidateDetails.profile?.full_name || 'User'}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {candidateDetails.profile?.full_name || 'Candidate'}
                  </h3>
                  {candidateDetails.headline && (
                    <p className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                      {candidateDetails.headline}
                    </p>
                  )}
                  {(candidateDetails.location || candidateDetails.preferred_work_style) && (
                    <p className="text-label font-normal mt-1" style={{ color: 'var(--color-textMuted)' }}>
                      {meta([candidateDetails.location, candidateDetails.preferred_work_style])}
                    </p>
                  )}
                </div>
              </div>
              {candidateDetails.bio && (
                <p className="text-sm -mt-2" style={{ color: 'var(--color-textSecondary)' }}>
                  {candidateDetails.bio}
                </p>
              )}

              {(() => {
                const archetype = getCandidateArchetype();
                if (!archetype) return null;
                return (
                  <Section title={archetype.name}>
                    <p className="text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                      {archetype.description}
                    </p>
                    {archetype.strengths && archetype.strengths.length > 0 && (
                      <p className="text-label font-normal mt-2" style={{ color: 'var(--color-textMuted)' }}>
                        Strengths: {archetype.strengths.slice(0, 4).join(', ')}
                      </p>
                    )}
                  </Section>
                );
              })()}

              <Section title="Personality traits">
                <div className="space-y-3">
                  {[
                    { label: 'Openness', score: candidateDetails.openness_score, color: 'var(--color-trait-openness)' },
                    { label: 'Conscientiousness', score: candidateDetails.conscientiousness_score, color: 'var(--color-trait-conscientiousness)' },
                    { label: 'Extraversion', score: candidateDetails.extraversion_score, color: 'var(--color-trait-extraversion)' },
                    { label: 'Agreeableness', score: candidateDetails.agreeableness_score, color: 'var(--color-trait-agreeableness)' },
                    { label: 'Stability', score: 100 - (candidateDetails.neuroticism_score || 50), color: 'var(--color-trait-stability)' },
                  ].map(trait => (
                    <div key={trait.label}>
                      <div className="flex items-center justify-between text-label font-normal mb-1">
                        <span style={{ color: 'var(--color-textSecondary)' }}>{trait.label}</span>
                        <span className="tabular-nums" style={{ color: 'var(--color-text)' }}>{trait.score}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-surfaceHover)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${trait.score}%`, backgroundColor: trait.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {candidateDetails.top_traits && candidateDetails.top_traits.length > 0 && (
                <Section title="Top traits">
                  <TagList items={candidateDetails.top_traits} />
                </Section>
              )}

              {candidateDetails.catalog_photos && candidateDetails.catalog_photos.length > 0 && (
                <Section title="Photos">
                  <div className="grid grid-cols-3 gap-2">
                    {candidateDetails.catalog_photos.slice(0, 6).map((photo, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                        <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {candidateDetails.hobbies && candidateDetails.hobbies.length > 0 && (
                <Section title="Hobbies and interests">
                  <TagList
                    items={candidateDetails.hobbies
                      .map(id => getHobbyById(id)?.name)
                      .filter((name): name is string => Boolean(name))}
                  />
                </Section>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--color-textMuted)' }}>
              No details available
            </div>
          )}
        </div>

        {/* Footer: one primary action */}
        <div
          className="px-6 py-4 border-t flex flex-wrap items-center justify-end gap-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {onFeedback && (
            <Button variant={onMessage ? 'outline' : 'primary'} onClick={onFeedback}>
              Leave feedback
            </Button>
          )}
          {onMessage && (
            <Button onClick={onMessage}>
              Message
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        {title}
        {count != null && (
          <span className="ml-1.5 font-normal tabular-nums" style={{ color: 'var(--color-textMuted)' }}>{count}</span>
        )}
      </h3>
      {children}
    </section>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, idx) => (
        <span
          key={`${item}-${idx}`}
          className="px-2.5 py-1 rounded-full text-caption"
          style={{ color: 'var(--color-textSecondary)', border: '1px solid var(--color-border)' }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
