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
    <div className="mt-[16px] flex flex-col gap-y-3 border-t border-[#F0F0F0] pt-[16px] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] text-[#AFB1B0]">
        Showing <span className="font-medium text-[#35373C]">{first}</span> to{' '}
        <span className="font-medium text-[#35373C]">{last}</span> of{' '}
        <span className="font-medium text-[#35373C]">{total}</span> {noun}
      </p>
      {!singlePage && (
        <div className="flex items-center gap-x-2">
          <button
            type="button"
            onClick={() => onChange(Math.max(offset - limit, 0))}
            disabled={atStart || disabled}
            className="cursor-pointer rounded-[10px] border border-[#E5E5E5] px-[14px] py-[7px] text-[12px] text-[#35373C] transition-colors hover:bg-[#F6F6F6] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onChange(offset + limit)}
            disabled={atEnd || disabled}
            className="cursor-pointer rounded-[10px] border border-[#E5E5E5] px-[14px] py-[7px] text-[12px] text-[#35373C] transition-colors hover:bg-[#F6F6F6] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
