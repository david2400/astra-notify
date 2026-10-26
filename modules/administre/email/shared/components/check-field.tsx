/** @format */

'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface CheckFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

/** Checkbox nativo compatible con register() de react-hook-form. */
export const CheckField = forwardRef<HTMLInputElement, CheckFieldProps>(
  ({ label, description, className, id, ...rest }, ref) => (
    <label htmlFor={id} className={`flex cursor-pointer items-start gap-3 ${className ?? ''}`}>
      <input
        ref={ref}
        id={id}
        type='checkbox'
        className='mt-0.5 h-4 w-4 rounded border-border accent-[hsl(var(--primary))]'
        {...rest}
      />
      <span className='space-y-0.5'>
        <span className='block text-sm font-medium text-foreground'>{label}</span>
        {description ? <span className='block text-xs text-muted-foreground'>{description}</span> : null}
      </span>
    </label>
  ),
);
CheckField.displayName = 'CheckField';
