'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TransferDetails } from './actions';
import { siteConfig } from '@/lib/site-config';

interface TransferInstructionsProps {
  transfer: TransferDetails;
  formatPrice: (amount: number) => string;
  /** Step 2 still owes us an address; the button below carries them there. */
  onContinue: () => void;
  /** Back to the card rail for this same order. */
  onPayByCard: () => void;
}

function CopyValue({ label, value, big }: { label: string; value: string; big?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* no clipboard in this context — the value is still readable */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="flex w-full items-baseline justify-between gap-x-4 border-b-2 border-[#121212]/15 py-[12px] text-left"
      title="Copy"
    >
      <span className="brut-label shrink-0">{label}</span>
      <span className="flex min-w-0 items-baseline gap-x-3">
        <span
          className={`truncate text-[#121212] ${big ? 'text-[22px] tracking-[0.06em]' : 'text-[14px]'}`}
          style={big ? { fontFamily: 'var(--font-display, Georgia, serif)' } : undefined}
        >
          {value}
        </span>
        <span className="shrink-0 text-[10px] font-bold tracking-[0.12em] text-[#B3101C] uppercase">
          {copied ? 'Copied' : 'Copy'}
        </span>
      </span>
    </button>
  );
}

/**
 * The account details a shopper who chose bank transfer needs, on the page
 * they are already on. The same details went to their inbox the moment the
 * transfer was opened, so a closed tab loses nothing.
 *
 * Three facts in the order a person needs them (where, how much, what to
 * write), then the one action that turns a transfer into a confirmed order:
 * the screenshot, sent by the fastest route there is.
 */
export function TransferInstructions({
  transfer,
  formatPrice,
  onContinue,
  onPayByCard,
}: TransferInstructionsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-[36px]"
      aria-labelledby="transfer-title"
    >
      <div className="flex items-baseline gap-x-3">
        <span className="text-[12px] font-bold tracking-[0.08em] text-[#B3101C]">1/2</span>
        <h1
          id="transfer-title"
          className="text-[26px] leading-none tracking-tight uppercase"
          style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
        >
          Transfer
        </h1>
        <span className="mt-auto mb-[5px] flex-1 border-t-2 border-[#121212] opacity-20" />
      </div>

      <p className="mt-[16px] text-[13px] leading-relaxed text-[#5C544A] normal-case">
        Your order{transfer.orderNumber ? ` No. ${transfer.orderNumber}` : ''} is held for 24 hours.
        Send the exact amount, put the reference in the narration, and message us the screenshot.
        We confirm within the hour, {siteConfig.hours.replace(' · ', ', ')}.
      </p>

      <div className="brut-plate mt-[20px] px-[18px] py-[6px]">
        <CopyValue label="Bank" value={transfer.bank.bank_name} />
        <CopyValue label="Account number" value={transfer.bank.account_number} big />
        <CopyValue label="Account name" value={transfer.bank.account_name} />
        <CopyValue label="Amount" value={formatPrice(transfer.amount)} big />
        <CopyValue label="Narration" value={transfer.reference} />
      </div>

      <a
        href={transfer.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="brut-btn brut-press mt-[20px] block text-center"
      >
        Send the screenshot on WhatsApp
      </a>

      <button type="button" onClick={onContinue} className="brut-btn-paper brut-press mt-[10px] w-full">
        {transfer.addressPending ? 'Next: where should we send it?' : 'Done — back to the shop'}
      </button>

      <p className="mt-4 text-center text-[11px] tracking-[0.12em] text-[#8E8E93] uppercase">
        Details also sent to your email
      </p>
      <p className="mt-[14px] text-center text-[12px] text-[#8E8E93] normal-case">
        Changed your mind?{' '}
        <button type="button" onClick={onPayByCard} className="underline underline-offset-2 hover:text-[#121212]">
          Pay by card instead
        </button>
      </p>
    </motion.section>
  );
}
