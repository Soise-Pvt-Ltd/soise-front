'use client';

import { totalRows, type PaginationMeta } from '@/lib/pagination';

/**
 * Prev/Next bar for admin lists.
 *
 * Exists because the Applications and Tier Requests screens had no pagination
 * at all: they fetched the backend's default 50 rows and the table just ended.
 * With 80 submitted applications the 30 oldest were invisible and never got
 * reviewed — there was nothing on screen to suggest more existed.
 */
export default function PaginationBar({
  pagination,
  onChange,
  disabled = false,
  noun = 'results',
}: {
  pagination: PaginationMeta;
  onChange: (offset: number) => void;
  disabled?: boolean;
  noun?: string;
}) {
  const total = totalRows(pagination);
  const { limit, offset } = pagination;
  if (total <= 0) return null;

  const first = offset + 1;
  const last = Math.min(offset + limit, total);
  const atStart = offset === 0;
  const atEnd = offset + limit >= total;

  // A single page needs no controls, but the count is still worth showing.
  const singlePage = atStart && atEnd;

  return (
    <div className="mt-4 flex flex-col gap-y-3 border-t border-[#E2DBCC] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] tracking-[0.14em] text-[#8C8377] uppercase">
        Showing <span className="text-[#14110E]">{first}</span>–
        <span className="text-[#14110E]">{last}</span> of{' '}
        <span className="text-[#14110E]">{total}</span> {noun}
      </p>
      {!singlePage && (
        <div className="flex items-center gap-x-2">
          <button
            type="button"
            onClick={() => onChange(Math.max(offset - limit, 0))}
            disabled={atStart || disabled}
            className="cursor-pointer rounded-full border border-[#DFD7C6] px-4 py-1.5 text-[12px] text-[#3F3830] transition-colors hover:border-[#14110E] hover:text-[#14110E] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-[#DFD7C6]"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onChange(offset + limit)}
            disabled={atEnd || disabled}
            className="cursor-pointer rounded-full border border-[#DFD7C6] px-4 py-1.5 text-[12px] text-[#3F3830] transition-colors hover:border-[#14110E] hover:text-[#14110E] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-[#DFD7C6]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
