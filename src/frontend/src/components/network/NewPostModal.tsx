import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, Search, Plus, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { HOBBIES, getHobbyById, type Hobby } from '../../data/hobbies';
import { useDialogFocus } from '../../hooks/useDialogFocus';

export type PostVisibility = 'everyone' | 'connections' | 'job_seekers' | 'employers';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImageItem {
  file: File;
  preview: string;
}

const VISIBILITY_OPTIONS: { value: PostVisibility; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'connections', label: 'Connections only' },
  { value: 'job_seekers', label: 'Job seekers only' },
  { value: 'employers', label: 'Employers only' },
];

const MAX_IMAGES = 10;
const MAX_CAPTION = 2200;

export function NewPostModal({ isOpen, onClose }: NewPostModalProps) {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [images, setImages] = useState<ImageItem[]>([]);
  const [caption, setCaption] = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [userHobbies, setUserHobbies] = useState<string[]>([]);
  const [userTraits, setUserTraits] = useState<string[]>([]);
  const [hobbySearch, setHobbySearch] = useState('');
  const [showHobbySearch, setShowHobbySearch] = useState(false);
  const [visibility, setVisibility] = useState<PostVisibility>('everyone');
  const [showVisibility, setShowVisibility] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const visibilityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) loadUserData();
    if (!isOpen) resetForm();
  }, [isOpen, user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (visibilityRef.current && !visibilityRef.current.contains(e.target as Node)) {
        setShowVisibility(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const resetForm = () => {
    setImages([]);
    setCaption('');
    setSelectedHobbies([]);
    setSelectedTraits([]);
    setHobbySearch('');
    setShowHobbySearch(false);
    setVisibility('everyone');
  };

  const loadUserData = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('candidates')
      .select('hobbies, top_traits')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setUserHobbies(data.hobbies || []);
      setUserTraits(data.top_traits || []);
      setSelectedHobbies(data.hobbies || []);
    }
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      showError('Limit reached', `Maximum ${MAX_IMAGES} images per post`);
      return;
    }

    const validFiles = fileArr
      .filter(f => {
        if (!f.type.startsWith('image/')) return false;
        if (f.size > 5 * 1024 * 1024) return false;
        return true;
      })
      .slice(0, remaining);

    if (validFiles.length < fileArr.length) {
      showError('Some skipped', 'Only images under 5MB are accepted');
    }

    const newItems: ImageItem[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages(prev => [...prev, ...newItems]);
  }, [images.length, showError]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    setImages(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  };

  // Drag & drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const toggleHobby = (id: string) => {
    setSelectedHobbies(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);
  };

  const toggleTrait = (trait: string) => {
    setSelectedTraits(prev => prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait]);
  };

  const resolveHobby = (id: string): Hobby | undefined => {
    if (id.startsWith('custom:')) {
      const name = id.replace('custom:', '').replace(/-/g, ' ');
      return { id, name: name.charAt(0).toUpperCase() + name.slice(1), emoji: '✨', category: 'social' as const };
    }
    return getHobbyById(id);
  };

  const searchResults = hobbySearch.trim()
    ? HOBBIES.filter(h =>
        h.name.toLowerCase().includes(hobbySearch.toLowerCase()) &&
        !selectedHobbies.includes(h.id)
      ).slice(0, 8)
    : [];

  const canPost = images.length > 0 && caption.trim().length > 0;

  const handlePost = async () => {
    if (!canPost || !user) return;
    setIsUploading(true);

    try {
      // Upload all images
      const uploadedUrls: string[] = [];
      for (const img of images) {
        const fileExt = img.file.name.split('.').pop();
        const fileName = `${user.id}/posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, img.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      const hobbyTags = [
        ...selectedHobbies,
        ...selectedTraits.map(t => `personality:${t}`),
      ];

      // Insert post — use first image as image_url, store all in hobby_tags metadata
      const { error: insertError } = await supabase
        .from('activity_posts')
        .insert({
          user_id: user.id,
          image_url: uploadedUrls[0],
          caption: caption.trim(),
          hobby_tags: hobbyTags,
        });

      if (insertError) throw insertError;

      showSuccess('Posted!', 'Your post is now live in the community feed.');
      onClose();
    } catch (err) {
      console.error('Error creating post:', err);
      showError('Post failed', 'Something went wrong. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Create post"
          className="relative w-full max-w-xl max-h-[85vh] rounded-xl overflow-hidden border"
          style={{
            backgroundColor: 'var(--color-backgroundSecondary)',
            borderColor: 'var(--color-border)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <h2 className="text-heading" style={{ color: 'var(--color-text)' }}>
              Create post
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-lg transition-colors hover:bg-[var(--color-surface)]"
              style={{ color: 'var(--color-textMuted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto max-h-[calc(85vh-140px)] px-5 py-4 space-y-5">
            {/* Image Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />

              {images.length > 0 ? (
                <div className="space-y-3">
                  {/* Preview Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                        {/* Always visible on touch screens, hover-revealed where there is a pointer */}
                        <button
                          onClick={() => removeImage(idx)}
                          aria-label={`Remove image ${idx + 1}`}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-black/80"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add more button */}
                    {images.length < MAX_IMAGES && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Add images"
                        className="aspect-square rounded-lg border border-dashed flex items-center justify-center transition-colors hover:border-[var(--color-borderHover)]"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <Plus className="w-6 h-6" style={{ color: 'var(--color-textMuted)' }} />
                      </button>
                    )}
                  </div>
                  <p className="text-caption tabular-nums" style={{ color: 'var(--color-textMuted)' }}>
                    {images.length}/{MAX_IMAGES} images
                  </p>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors"
                  style={{
                    borderColor: isDragging ? 'var(--color-accent)' : 'var(--color-border)',
                    backgroundColor: isDragging ? 'var(--color-surface)' : 'transparent',
                  }}
                >
                  <Camera className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-textMuted)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    Drag and drop, or click to upload
                  </p>
                  <p className="text-caption mt-1" style={{ color: 'var(--color-textMuted)' }}>
                    Up to {MAX_IMAGES} images &middot; Max 5MB each
                  </p>
                </div>
              )}
            </div>

            {/* Caption */}
            <div>
              <label className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  Caption <span style={{ color: 'var(--color-error)' }}>*</span>
                </span>
                <span
                  className="text-caption tabular-nums"
                  style={{ color: caption.length > MAX_CAPTION ? 'var(--color-error)' : 'var(--color-textMuted)' }}
                >
                  {caption.length}/{MAX_CAPTION}
                </span>
              </label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Write a caption…"
                className="w-full px-3 py-2.5 text-sm rounded-lg resize-none outline-none transition-colors focus:border-[var(--color-accent)]"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
                rows={4}
                maxLength={MAX_CAPTION}
              />
            </div>

            {/* Hobby Tags */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                Hobbies & interests
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {userHobbies.map(id => {
                  const hobby = resolveHobby(id);
                  if (!hobby) return null;
                  const isSelected = selectedHobbies.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleHobby(id)}
                      aria-pressed={isSelected}
                      className="px-2.5 py-1 rounded-full text-caption font-medium transition-colors"
                      style={{
                        border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                        color: isSelected ? 'var(--color-accent)' : 'var(--color-textSecondary)',
                      }}
                    >
                      {hobby.name}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setShowHobbySearch(!showHobbySearch)}
                className="text-label flex items-center gap-1"
                style={{ color: 'var(--color-accent)' }}
              >
                <Search className="w-3 h-3" />
                {showHobbySearch ? 'Hide search' : 'Add more hobbies'}
              </button>
              {showHobbySearch && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={hobbySearch}
                    onChange={e => setHobbySearch(e.target.value)}
                    placeholder="Search hobbies…"
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors focus:border-[var(--color-accent)]"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                  {searchResults.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {searchResults.map(h => (
                        <button
                          key={h.id}
                          onClick={() => { toggleHobby(h.id); setHobbySearch(''); }}
                          className="px-2.5 py-1 rounded-full text-caption font-medium transition-colors hover:border-[var(--color-borderHover)]"
                          style={{ border: '1px solid var(--color-border)', color: 'var(--color-textSecondary)' }}
                        >
                          + {h.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Personality Tags */}
            {userTraits.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                  Personality tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {userTraits.map(trait => {
                    const isSelected = selectedTraits.includes(trait);
                    return (
                      <button
                        key={trait}
                        onClick={() => toggleTrait(trait)}
                        aria-pressed={isSelected}
                        className="px-2.5 py-1 rounded-full text-caption font-medium transition-colors"
                        style={{
                          border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                          color: isSelected ? 'var(--color-accent)' : 'var(--color-textSecondary)',
                        }}
                      >
                        {trait}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Visibility */}
            <div className="relative" ref={visibilityRef}>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
                Visibility
              </label>
              <button
                onClick={() => setShowVisibility(!showVisibility)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                {VISIBILITY_OPTIONS.find(o => o.value === visibility)?.label}
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-textMuted)' }} />
              </button>
              {showVisibility && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-10 border"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  {VISIBILITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setVisibility(opt.value); setShowVisibility(false); }}
                      className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surfaceHover)]"
                      style={{
                        color: visibility === opt.value ? 'var(--color-accent)' : 'var(--color-text)',
                        fontWeight: visibility === opt.value ? 500 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 px-5 py-4 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Button variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              onClick={handlePost}
              disabled={!canPost}
              isLoading={isUploading}
              size="sm"
            >
              {isUploading ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
