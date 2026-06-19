'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, MinusIcon } from '@/components/icons';

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
}

function AccordionGroup({ items, idPrefix }: { items: FaqItem[]; idPrefix: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-[#EAEAEA] rounded-[16px] border border-[#EAEAEA]">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const panelId = `${idPrefix}-panel-${i}`;
        const buttonId = `${idPrefix}-button-${i}`;
        return (
          <div key={i}>
            <button
              type="button"
              id={buttonId}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-x-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className="text-[15px] font-medium text-[#121212]">
                {item.q}
              </span>
              <span className="shrink-0 text-[#8E8E93]">
                {isOpen ? <MinusIcon /> : <PlusIcon />}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <p className="px-5 pb-5 text-[14px] leading-relaxed text-[#35373C]">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default function FaqAccordion({ categories }: { categories: FaqCategory[] }) {
  return (
    <div className="space-y-[28px]">
      {categories.map((category) => (
        <section
          key={category.id}
          id={category.id}
          aria-labelledby={`${category.id}-heading`}
          className="scroll-mt-[88px]"
        >
          <h3
            id={`${category.id}-heading`}
            className="mb-[12px] text-[13px] font-bold tracking-wide text-[#8E8E93] uppercase"
          >
            {category.title}
          </h3>
          <AccordionGroup items={category.items} idPrefix={category.id} />
        </section>
      ))}
    </div>
  );
}
