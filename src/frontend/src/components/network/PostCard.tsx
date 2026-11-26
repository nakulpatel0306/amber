import { useState, useRef } from 'react';
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Flag,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { getHobbyById } from '../../data/hobbies';
import { formatDistanceToNowStrict } from 'date-fns';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PostUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: 'candidate' | 'employer' | null;
  headline: string | null;
  location: string | null;
  companyName: string | null;
}

export interface FeedPost {
  id: string;
  user: PostUser;
  images: string[];
  caption: string | null;
  hobbyTags: string[];
  source: 'activity_post' | 'catalog';
  activityPostId?: string;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
}

interface PostCardProps {
  post: FeedPost;
  isOwn: boolean;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function resolveTag(tag: string): string | null {
  if (tag.startsWith('personality:')) return tag.replace('personality:', '');

  if (tag.startsWith('custom:')) {
    const name = tag.replace('custom:', '').replace(/-/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  return getHobbyById(tag)?.name ?? null;
}

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNowStrict(new Date(dateStr), { addSuffix: false });
  } catch {
    return '';
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PostCard({ post, isOwn, onLike, onDelete }: PostCardProps) {
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasMultiple = post.images.length > 1;
  const resolvedTags = post.hobbyTags.map(resolveTag).filter((t): t is string => Boolean(t));
  const visibleTags = showAllTags ? resolvedTags : resolvedTags.slice(0, 4);
  const hiddenTagCount = resolvedTags.length - 4;

  // Which side of the table, said in the meta line instead of a colored badge
  const roleLabel = post.user.role === 'employer'
    ? post.user.companyName ?? 'Employer'
    : post.user.role === 'candidate'
      ? 'Job seeker'
      : null;
  const meta = [roleLabel, post.user.location, post.createdAt ? timeAgo(post.createdAt) : null]
    .filter(Boolean)
    .join(' · ');

  const prevImage = () => setCarouselIdx(i => Math.max(0, i - 1));
  const nextImage = () => setCarouselIdx(i => Math.min(post.images.length - 1, i + 1));

  return (
    <div className="bento-card !p-0 overflow-hidden">
      {/* ---- Header ---- */}
      <div className="flex items-center gap-3 p-4">
        <Avatar src={post.user.avatar_url} fallback={post.user.full_name} size="md" className="flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {post.user.full_name}
          </p>
          {meta && (
            <p className="text-caption truncate" style={{ color: 'var(--color-textMuted)' }}>
              {meta}
            </p>
          )}
        </div>

        {/* Overflow menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Post options"
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surfaceHover)]"
            style={{ color: 'var(--color-textMuted)' }}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-20 min-w-[140px] border"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              {isOwn && (
                <button
                  onClick={() => { onDelete(post.id); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors hover:bg-[var(--color-surfaceHover)]"
                  style={{ color: 'var(--color-error)' }}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
              <button
                onClick={() => setShowMenu(false)}
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors hover:bg-[var(--color-surfaceHover)]"
                style={{ color: 'var(--color-textSecondary)' }}
              >
                <Flag className="w-4 h-4" /> Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---- Image carousel ---- */}
      {post.images.length > 0 && (
        <div className="relative select-none" style={{ backgroundColor: 'var(--color-surfaceHover)' }}>
          <img
            src={post.images[carouselIdx]}
            alt={`Post by ${post.user.full_name}`}
            className="w-full aspect-square object-cover"
            loading="lazy"
            draggable={false}
          />

          {hasMultiple && carouselIdx > 0 && (
            <button
              onClick={prevImage}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {hasMultiple && carouselIdx < post.images.length - 1 && (
            <button
              onClick={nextImage}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {hasMultiple && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-caption tabular-nums bg-black/60 text-white">
              {carouselIdx + 1}/{post.images.length}
            </div>
          )}

          {hasMultiple && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {post.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIdx(i)}
                  aria-label={`Photo ${i + 1}`}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: i === carouselIdx ? '#fff' : 'rgba(255, 255, 255, 0.45)' }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- Like ---- */}
      <div className="flex items-center px-4 py-2.5">
        <button
          onClick={() => onLike(post.id)}
          aria-label={post.isLiked ? 'Unlike' : 'Like'}
          aria-pressed={post.isLiked}
          className="flex items-center gap-1.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <Heart
            className="w-5 h-5"
            color={post.isLiked ? 'var(--color-accent)' : 'var(--color-textSecondary)'}
            fill={post.isLiked ? 'var(--color-accent)' : 'none'}
          />
          {post.likeCount > 0 && (
            <span className="text-label tabular-nums" style={{ color: 'var(--color-textSecondary)' }}>
              {post.likeCount}
            </span>
          )}
        </button>
      </div>

      {/* ---- Caption ---- */}
      {post.caption && (
        <div className="px-4 pb-2">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
            <span className="font-semibold mr-1.5">{post.user.full_name.split(' ')[0]}</span>
            {captionExpanded || post.caption.length <= 120 ? (
              post.caption
            ) : (
              <>
                {post.caption.slice(0, 120)}…
                <button
                  onClick={() => setCaptionExpanded(true)}
                  className="ml-1 font-medium"
                  style={{ color: 'var(--color-textMuted)' }}
                >
                  more
                </button>
              </>
            )}
          </p>
        </div>
      )}

      {/* ---- Hobby / interest tags: all one quiet style ---- */}
      {resolvedTags.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleTags.map((tag, i) => (
              <span
                key={`t-${i}`}
                className="px-2 py-0.5 rounded-full text-caption"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-textSecondary)' }}
              >
                {tag}
              </span>
            ))}
            {!showAllTags && hiddenTagCount > 0 && (
              <button
                onClick={() => setShowAllTags(true)}
                className="px-1 text-caption"
                style={{ color: 'var(--color-accent)' }}
              >
                +{hiddenTagCount} more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
