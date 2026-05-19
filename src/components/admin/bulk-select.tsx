'use client';
import { useEffect, useRef } from 'react';

// Row checkboxes are associated to the bulk form via the `form="<id>"`
// attribute, so they live OUTSIDE the <form> element (e.g. in the table).
// `form.querySelectorAll` only finds DOM descendants and would miss them —
// `form.elements` includes all form-associated controls regardless of
// position. Likewise their `change` events bubble through the table, not
// the form, so we listen at document level.
function getBoxes(form: HTMLFormElement, name: string): HTMLInputElement[] {
  return Array.from(form.elements).filter(
    (el): el is HTMLInputElement =>
      el instanceof HTMLInputElement && el.type === 'checkbox' && el.name === name
  );
}

function useBoxChangeListener(handler: () => void, checkboxName: string) {
  useEffect(() => {
    const onChange = (ev: Event) => {
      const t = ev.target;
      if (
        t instanceof HTMLInputElement &&
        t.type === 'checkbox' &&
        t.name === checkboxName
      ) {
        handler();
      }
    };
    document.addEventListener('change', onChange, true);
    handler();
    return () => document.removeEventListener('change', onChange, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkboxName]);
}

export function SelectAllCheckbox({
  formId,
  checkboxName = 'ids',
  className
}: {
  formId: string;
  checkboxName?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useBoxChangeListener(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form || !ref.current) return;
    const boxes = getBoxes(form, checkboxName);
    const checked = boxes.filter((b) => b.checked).length;
    ref.current.checked = boxes.length > 0 && checked === boxes.length;
    ref.current.indeterminate = checked > 0 && checked < boxes.length;
  }, checkboxName);

  const onToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const next = e.target.checked;
    const boxes = getBoxes(form, checkboxName);
    boxes.forEach((b) => {
      b.checked = next;
    });
    // Fire one real change event from a row checkbox so the document-level
    // listeners (this checkbox's sync + SelectedCounter) recompute.
    if (boxes[0]) boxes[0].dispatchEvent(new Event('change', { bubbles: true }));
  };

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all on this page"
      onChange={onToggle}
      className={className ?? 'h-3.5 w-3.5'}
    />
  );
}

export function SelectedCounter({
  formId,
  checkboxName = 'ids'
}: {
  formId: string;
  checkboxName?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useBoxChangeListener(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form || !ref.current) return;
    const n = getBoxes(form, checkboxName).filter((b) => b.checked).length;
    ref.current.textContent = String(n);
  }, checkboxName);

  return <span ref={ref}>0</span>;
}
