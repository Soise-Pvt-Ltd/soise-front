'use client';

/**
 * A labelled form field.
 *
 * Every checkout input used to be placeholder-only. Placeholders disappear the
 * moment someone types, so a half-filled form gives no clue what each box was
 * for — and screen readers get no accessible name at all. The label is real and
 * stays put.
 */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label htmlFor={htmlFor} className="brut-label mb-[8px] block">
        {label}
        {hint && (
          <span className="ml-[8px] font-medium tracking-[0.04em] text-[#8E8E93] normal-case">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
