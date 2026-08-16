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
      <label
        htmlFor={htmlFor}
        className="mb-[6px] block text-[12px] font-medium text-[#35373C] normal-case"
      >
        {label}
        {hint && (
          <span className="ml-[6px] font-normal text-[#8E8E93]">{hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}
