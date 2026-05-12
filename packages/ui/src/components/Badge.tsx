import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn.js';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset',
  {
    variants: {
      variant: {
        default: 'bg-bg-secondary text-text ring-border',
        success: 'bg-primary-lightest text-primary-dark ring-primary-light/40',
        warning: 'bg-warning-light text-warning-dark ring-warning-light',
        danger: 'bg-danger-light text-danger-dark ring-danger-light',
        info: 'bg-info-light text-info-dark ring-info-light',
        neutral: 'bg-bg-secondary text-text-secondary ring-border',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
