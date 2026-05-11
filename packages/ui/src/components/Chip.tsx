import * as React from 'react';
import { cn } from '../lib/cn.js';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  warn?: boolean;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active = false, warn = false, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active && 'bg-primary text-white border-primary',
        !active && !warn && 'bg-surface text-text border-border hover:bg-bg-secondary',
        warn && 'bg-warning-light text-warning-dark border-warning',
        className,
      )}
      {...props}
    />
  ),
);
Chip.displayName = 'Chip';
