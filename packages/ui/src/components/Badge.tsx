import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn.js';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-bg-secondary text-text',
        success: 'bg-primary-light text-primary-dark',
        warning: 'bg-warning-light text-warning-dark',
        danger: 'bg-danger-light text-danger-dark',
        info: 'bg-info-light text-info-dark',
        neutral: 'bg-border-light text-text-secondary',
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
