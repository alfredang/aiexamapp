'use client';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Submit button that reflects the surrounding <form>'s pending state via
 * useFormStatus. Use it as a drop-in inside server-action forms when you
 * want a spinner + disabled state without converting the whole form to a
 * client component.
 */
export function SubmitBusyButton({
  idleLabel,
  busyLabel,
  className
}: {
  idleLabel: ReactNode;
  busyLabel: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <>
          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> {busyLabel}
        </>
      ) : (
        idleLabel
      )}
    </button>
  );
}
