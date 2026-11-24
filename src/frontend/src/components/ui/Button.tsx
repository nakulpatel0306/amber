import { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center gap-2',
      'font-medium rounded-lg',
      'transition-[transform,background-color,color,box-shadow,border-color] duration-150 ease-out-strong',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'active:scale-[0.97]',
      fullWidth && 'w-full'
    );

    const variants = {
      primary: cn(
        'bg-[var(--color-accent)] text-[var(--color-accentText)]',
        'hover:bg-[var(--color-accentHover)]',
        'focus-visible:ring-[var(--color-accent)]'
      ),
      secondary: cn(
        'bg-[var(--color-surface)] text-[var(--color-text)]',
        'hover:bg-[var(--color-surfaceHover)]',
        'focus-visible:ring-[var(--color-border)]',
        'border border-[var(--color-border)]'
      ),
      outline: cn(
        'bg-transparent text-[var(--color-text)]',
        'border border-[var(--color-border)]',
        'hover:bg-[var(--color-surface)] hover:border-[var(--color-borderHover)]',
        'focus-visible:ring-[var(--color-accent)]'
      ),
      ghost: cn(
        'bg-transparent text-[var(--color-textSecondary)]',
        'hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
        'focus-visible:ring-[var(--color-accent)]'
      ),
      danger: cn(
        'bg-[var(--color-error)] text-white',
        'hover:brightness-110',
        'focus-visible:ring-[var(--color-error)]'
      ),
      link: cn(
        'bg-transparent text-[var(--color-accent)]',
        'hover:underline underline-offset-4',
        'focus-visible:ring-[var(--color-accent)]',
        'p-0 h-auto'
      ),
    };

    const sizes = {
      xs: 'min-h-7 px-2.5 py-1 text-xs',
      sm: 'min-h-8 px-3 py-1 text-label',
      md: 'min-h-10 px-4 py-2 text-sm',
      lg: 'min-h-11 px-5 py-2.5 text-sm',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          variant !== 'link' && sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
