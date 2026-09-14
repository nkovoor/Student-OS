'use client';

// shadcn/ui's Select — same compound-component API and Radix primitive
// (@radix-ui/react-select) shadcn itself uses, restyled with this project's
// own CSS custom-property tokens (globals.css) instead of Tailwind utility
// classes + cva. First proof-of-concept for the pattern this project uses
// shadcn as going forward (Option B): pull the primitive + shadcn's
// component structure/accessibility wiring directly, write plain CSS
// against it, no Tailwind at runtime. The Trigger matches .input's exact
// visual spec (globals.css) so it's indistinguishable from the plain
// text/date/time inputs it sits next to in a form row.

import * as SelectPrimitive from '@radix-ui/react-select';
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger ref={ref} className={'select-trigger' + (className ? ` ${className}` : '')} {...props}>
    {children}
    <SelectPrimitive.Icon className="select-trigger-icon">
      <ChevronIcon />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={'select-content' + (className ? ` ${className}` : '')}
      position={position}
      sideOffset={4}
      {...props}
    >
      <SelectPrimitive.Viewport className="select-viewport">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

export const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item ref={ref} className={'select-item' + (className ? ` ${className}` : '')} {...props}>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="select-item-indicator">
      <CheckIcon />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
