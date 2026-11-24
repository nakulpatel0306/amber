import { useEffect, useId, useRef, Fragment, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';
import { useDialogFocus } from '../../hooks/useDialogFocus';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  maxWidth?: string;
  dialogClassName?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  maxWidth,
  dialogClassName,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useDialogFocus(contentRef, isOpen, closeOnEscape ? onClose : undefined);
  const titleId = useId();
  const descriptionId = useId();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <Fragment>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={cn(
          'fixed inset-0 z-50 modal-backdrop',
          'animate-fade-in'
        )}
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          className={cn(
            'relative w-full rounded-2xl p-6 [box-shadow:var(--shadow-lg)]',
            'animate-scale-in',
            !maxWidth && sizeMap[size],
            dialogClassName
          )}
          style={{
            backgroundColor: 'var(--color-backgroundSecondary)',
            border: '1px solid var(--color-border)',
            ...(maxWidth ? { maxWidth } : {}),
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className={cn(
                'absolute top-4 right-4 p-2 rounded-lg',
                'transition-colors hover:bg-[var(--color-surface)]'
              )}
              style={{ color: 'var(--color-textMuted)' }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header */}
          {(title || description) && (
            <div className="mb-6 pr-8">
              {title && (
                <h2
                  id={titleId}
                  className="text-lg font-semibold"
                  style={{ color: 'var(--color-text)' }}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={descriptionId}
                  className="mt-1 text-sm"
                  style={{ color: 'var(--color-textMuted)' }}
                >
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Content */}
          {children}
        </div>
      </div>
    </Fragment>,
    // Portalled so the overlay covers the whole viewport, sidebar included, even under transformed parents
    document.body
  );
}

// Modal Footer component for action buttons
export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 mt-6 pt-4 border-t',
        className
      )}
      style={{ borderColor: 'var(--color-border)' }}
    >
      {children}
    </div>
  );
}
