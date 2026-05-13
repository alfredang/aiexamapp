'use client';
import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const onChange = () => sync();
    const sync = () => {
      const boxes = form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${checkboxName}"]`);
      const checked = Array.from(boxes).filter((b) => b.checked).length;
      if (!ref.current) return;
      ref.current.checked = checked > 0 && checked === boxes.length;
      ref.current.indeterminate = checked > 0 && checked < boxes.length;
    };
    form.addEventListener('change', onChange);
    sync();
    return () => form.removeEventListener('change', onChange);
  }, [formId, checkboxName]);

  const onToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const boxes = form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${checkboxName}"]`);
    boxes.forEach((b) => (b.checked = e.target.checked));
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

export function SelectedCounter({ formId, checkboxName = 'ids' }: { formId: string; checkboxName?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const update = () => {
      const boxes = form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${checkboxName}"]:checked`);
      if (ref.current) ref.current.textContent = String(boxes.length);
    };
    form.addEventListener('change', update);
    update();
    return () => form.removeEventListener('change', update);
  }, [formId, checkboxName]);

  return <span ref={ref}>0</span>;
}
