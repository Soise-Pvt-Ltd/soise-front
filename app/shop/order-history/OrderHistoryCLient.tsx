'use client';

import { useState } from 'react';

import Link from 'next/link';
import { InfoIcon } from '@/components/icons';
import Footer from '@/components/footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/lib/currency-context';

interface Variant {
  id: string;
  color: string;
  size: string;
  price: number;
  media: Array<{
    url: string;
    alt_text: string;
    variants: {
      thumbnail: string;
      small: string;
      medium: string;
      large: string;
      original: string;
      public: string;
    };
  }>;
  product: string;
  sku: string;
  // Backend-resolved fallback: this variant's own media, or (if empty) a
  // same-color sibling's media, or any sibling's media. Prefer this over
  // `media` when rendering - `media` alone can be legitimately empty for a
  // variant that inherits its photos from the product's cover variant.
  display_media?: Variant['media'];
}

interface OrderItem {
  id: string;
  line_total: number;
  quantity: number;
  unit_price: number;
  variant: Variant;
}

interface Order {
  id: string;
  order_number?: number;
  created_at: string;
  total: number;
  currency: string;
  status: string;
  items: OrderItem[];
  payments: Array<{
    id: string;
    status: string;
    amount: number;
  }>;
}

interface OrderHistoryClientProps {
  orders: Order[];
}

/**
 * PRESSED INK — the order ledger, pressed to match the checkout it follows
 * (see the brut- tokens in globals.css). Bone paper, 2px ink rules, Instrument
 * Serif for the numbers that are worth reading, one crimson accent.
 */
const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// A paid order moves through processing → shipped → delivered without ever
// literally being "completed", so the completed rail matches every post-payment
// state. Before this, a freshly paid order appeared in NEITHER tab.
const COMPLETED_STATUSES = [
  'paid',
  'processing',
  'shipped',
  'delivered',
  'completed',
];
const PENDING_STATUSES = ['pending_payment', 'created'];

/**
 * Status is carried by ink weight, not by a hue. A paid order reads in full
 * ink; one still awaiting payment sits back in muted ink. There is no
 * green/amber/red palette here — the only colour on this page is the crimson
 * accent, and it is spent on the masthead, not on a traffic light.
 */
function statusTone(status: string): string {
  return COMPLETED_STATUSES.includes(status)
    ? 'font-bold text-[#121212]'
    : 'text-[#5C544A]';
}

export default function OrderHistoryClient({
  orders,
}: OrderHistoryClientProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>(
    'pending',
  );
  const [showStatusInfo, setShowStatusInfo] = useState(false);

  const pendingOrders = orders.filter((order) =>
    PENDING_STATUSES.includes(order.status),
  );
  const completedOrders = orders.filter((order) =>
    COMPLETED_STATUSES.includes(order.status),
  );

  const totalPieces = orders.reduce(
    (sum, order) =>
      sum + order.items.reduce((s, item) => s + item.quantity, 0),
    0,
  );

  return (
    <>
      {/* Bone ground runs behind the footer too, so the page has one paper. */}
      <div className="bg-[#F5F0E8] text-[#121212]">
        <main className="mx-auto max-w-[880px] px-5 pt-10 pb-24">
          {/* ——— Masthead ——— */}
          <header className="brut-rise">
            <div className="flex items-start justify-between gap-4">
              <p className="brut-label text-[#B3101C]">
                Soise Maison · Order Ledger
              </p>
              <button
                type="button"
                className="brut-plate brut-press flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center"
                aria-label="About order statuses"
                aria-expanded={showStatusInfo}
                title="About order statuses"
                onClick={() => setShowStatusInfo((v) => !v)}
              >
                <InfoIcon />
              </button>
            </div>

            <h1
              className="mt-4 text-[48px] leading-[0.95] tracking-tight uppercase sm:text-[72px]"
              style={serif}
            >
              The Ledger<span className="text-[#B3101C]">.</span>
            </h1>
            <p className="mt-6 text-[15px] leading-relaxed text-[#3F3830]">
              Every piece, accounted for.
            </p>

            {/* Ledger meta row */}
            <div className="brut-rule mt-8 flex flex-wrap items-center gap-x-[28px] gap-y-[10px] pt-[16px] text-[11px] font-bold tracking-[0.16em] text-[#5C544A] uppercase">
              <span>
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
              <span>
                {totalPieces} {totalPieces === 1 ? 'Piece' : 'Pieces'}
              </span>
              <Link
                href="/shop/profile"
                className="text-[#B3101C] underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
              >
                Private wardrobe
              </Link>
            </div>
          </header>

          {showStatusInfo && (
            <div className="brut-plate mt-[18px] p-[16px] text-[13px] leading-relaxed text-[#5C544A]">
              <p>
                <span className="font-bold text-[#121212]">Pending</span> orders
                are awaiting payment.{' '}
                <span className="font-bold text-[#121212]">Completed</span>{' '}
                orders are paid — being prepared, on their way, or already with
                you.
              </p>
            </div>
          )}

          {/* Tabs — the rule under them is the divider; the active tab is
              marked by weight and a solid ink bar, never by colour. */}
          <div className="brut-rise mt-[28px]" style={{ animationDelay: '0.08s' }}>
            <div className="flex items-center gap-[6px] border-b-2 border-[#121212] text-[11px] font-bold tracking-[0.16em] uppercase">
              {(['pending', 'completed'] as const).map((tab) => (
                <div
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative cursor-pointer px-[12px] pb-[10px] transition-colors duration-200 ${
                    activeTab === tab
                      ? 'text-[#121212]'
                      : 'text-[#5C544A] hover:text-[#121212]'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {activeTab === tab && (
                    <motion.div
                      className="absolute -bottom-[2px] left-0 h-[4px] w-full bg-[#121212]"
                      layoutId="tab-indicator"
                      transition={{
                        type: 'spring',
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'pending' && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  {pendingOrders.length > 0 ? (
                    // One plate for the whole ledger, rows ruled apart — a
                    // shadowed card per order is unreadable at any length.
                    <div className="brut-plate brut-shadow mt-[24px]">
                      {pendingOrders.map((order, i) => (
                        <OrderHistoryItem
                          key={order.id}
                          item={order}
                          index={i}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Nothing awaiting payment."
                      body="Orders that are mid-checkout rest here until they're settled."
                    />
                  )}
                </motion.div>
              )}
              {activeTab === 'completed' && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  {completedOrders.length > 0 ? (
                    <div className="brut-plate brut-shadow mt-[24px]">
                      {completedOrders.map((order, i) => (
                        <OrderHistoryItem
                          key={order.id}
                          item={order}
                          index={i}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Your ledger awaits."
                      body="Every piece you collect is recorded here — a quiet history of your taste."
                      cta={{
                        href: '/shop/product-listing',
                        label: 'Begin your collection',
                      }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <motion.div
      className="brut-plate brut-shadow mt-[24px] px-[24px] py-[64px] text-center"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
    >
      <h2
        className="text-[30px] leading-[0.95] tracking-tight uppercase sm:text-[40px]"
        style={serif}
      >
        {title}
      </h2>
      <p className="mx-auto mt-[14px] max-w-[420px] text-[14px] leading-relaxed text-[#3F3830]">
        {body}
      </p>
      {cta && (
        <Link
          href={cta.href}
          className="brut-press mt-[26px] inline-flex h-[50px] items-center justify-center rounded-[2px] border-2 border-[#121212] bg-[#121212] px-[34px] text-[12px] font-bold tracking-[0.14em] text-white uppercase"
        >
          {cta.label}
        </Link>
      )}
    </motion.div>
  );
}

function OrderHistoryItem({
  item,
  index = 0,
}: {
  item: Order;
  index?: number;
}) {
  const totalQuantity = item.items.reduce(
    (sum, current) => sum + current.quantity,
    0,
  );

  // Get first item's variant image, falling back to a sibling variant's
  // photos if this exact color/size hasn't been shot yet.
  const firstItemMedia =
    item.items[0]?.variant?.display_media?.[0] ??
    item.items[0]?.variant?.media?.[0];
  const firstItemImage = firstItemMedia?.variants?.medium;
  const firstItemAlt = firstItemMedia?.alt_text || 'Product image';

  const { formatPrice } = useCurrency();

  const orderNo =
    item.order_number != null
      ? String(item.order_number).padStart(4, '0')
      : (item.id ?? '').toString().substring(0, 7);

  const placed = new Date(item.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Delivered is the one state worth stamping: it's the end of the story, and
  // it's the state that unlocks store credit. Everything else is weight + copy.
  const delivered = item.status === 'delivered';

  return (
    <motion.div
      className={index > 0 ? 'brut-rule' : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: EASE,
      }}
    >
      <div className="flex w-full gap-x-[18px] p-[14px] sm:p-[16px]">
        {/* The piece, plated on bone inside the ledger */}
        <div className="relative size-[104px] shrink-0 overflow-hidden rounded-[2px] border-2 border-[#121212] bg-[#F5F0E8] sm:size-[120px]">
          {firstItemImage ? (
            <img
              src={firstItemImage}
              alt={firstItemAlt}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-[34px] text-[#5C544A]" style={serif}>
                S
              </span>
            </div>
          )}
          {totalQuantity > 1 && (
            <span
              className="absolute top-[6px] right-[6px] rounded-[2px] border-2 border-[#121212] bg-white px-[6px] py-[1px] text-[10px] font-bold tracking-[0.12em] text-[#121212]"
              title={`${totalQuantity} pieces in this order`}
            >
              ×{totalQuantity}
            </span>
          )}
        </div>

        {/* Ledger entry */}
        <div className="flex min-w-0 flex-1 flex-col justify-center py-[2px]">
          <div className="flex items-baseline justify-between gap-x-[12px]">
            <div
              className="truncate text-[19px] tracking-tight uppercase sm:text-[22px]"
              style={serif}
            >
              Order No. {orderNo}
            </div>
            <div
              className="shrink-0 text-[17px] sm:text-[19px]"
              style={serif}
            >
              {formatPrice(item.total)}
            </div>
          </div>
          <div className="mt-[8px] flex flex-wrap items-center gap-x-3 gap-y-2">
            {delivered ? (
              <span className="brut-stamp">Delivered</span>
            ) : (
              <span
                className={`text-[11px] tracking-[0.16em] uppercase ${statusTone(item.status)}`}
              >
                {item.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <div className="mt-[6px] text-[11px] tracking-[0.14em] text-[#5C544A] uppercase">
            Placed {placed}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
