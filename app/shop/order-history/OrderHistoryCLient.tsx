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

const LUXE = { fontFamily: 'var(--font-luxe)' };
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

function statusTone(status: string): string {
  return COMPLETED_STATUSES.includes(status) ? 'text-[#B8945F]' : 'text-[#8E8E93]';
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
      <main className="text-[#121212]">
        {/* ——— Maison header ——— */}
        <section className="px-[24px] pt-[8px] pb-[36px] md:px-[40px]">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[12px]">
                <span className="h-px w-[34px] bg-[#1c1c1c]" />
                <span className="text-[11px] tracking-[0.34em] text-[#8E8E93] uppercase">
                  Soise Maison · Order Ledger
                </span>
              </div>
              <button
                type="button"
                className="cursor-pointer text-[#8E8E93] transition-colors hover:text-[#121212]"
                aria-label="About order statuses"
                aria-expanded={showStatusInfo}
                title="About order statuses"
                onClick={() => setShowStatusInfo((v) => !v)}
              >
                <InfoIcon />
              </button>
            </div>

            <div className="mt-[26px]">
              <h1
                className="text-[40px] leading-[0.98] sm:text-[54px] md:text-[64px]"
                style={LUXE}
              >
                The Ledger
                <span className="text-[#B8945F]">.</span>
              </h1>
              <p
                className="mt-[8px] text-[17px] text-[#6b6b6b] italic sm:text-[20px]"
                style={LUXE}
              >
                Every piece, accounted for.
              </p>
            </div>

            {/* Ledger meta row */}
            <div className="mt-[26px] flex flex-wrap items-center gap-x-[28px] gap-y-[10px] border-t border-[#ECECEC] pt-[18px] text-[11px] tracking-[0.18em] text-[#8E8E93] uppercase">
              <span>
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
              <span>
                {totalPieces} {totalPieces === 1 ? 'Piece' : 'Pieces'}
              </span>
              <Link
                href="/shop/profile"
                className="text-[#121212] underline-offset-4 transition-opacity hover:underline focus-visible:underline focus-visible:outline-none"
              >
                Private wardrobe
              </Link>
            </div>
          </motion.div>

          {showStatusInfo && (
            <div className="mt-[20px] rounded-[6px] bg-[#F7F4EF] p-[16px] text-[13px] leading-relaxed text-[#6b6b6b]">
              <p>
                <span className="font-medium text-[#121212]">Pending</span>{' '}
                orders are awaiting payment.{' '}
                <span className="font-medium text-[#121212]">Completed</span>{' '}
                orders are paid — being prepared, on their way, or already with
                you.
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="mt-[28px] flex items-center gap-[10px] border-b border-[#ECECEC] text-[11px] tracking-[0.18em] text-[#8E8E93] uppercase">
            {(['pending', 'completed'] as const).map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative cursor-pointer px-[10px] pb-[10px] transition-colors duration-200 ${
                  activeTab === tab
                    ? 'font-medium text-[#121212]'
                    : 'text-[#8E8E93] hover:text-[#121212]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] w-full bg-[#B8945F]"
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
                  <div className="mt-[24px] space-y-[16px]">
                    {pendingOrders.map((order, i) => (
                      <OrderHistoryItem key={order.id} item={order} index={i} />
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
                  <div className="mt-[24px] space-y-[16px]">
                    {completedOrders.map((order, i) => (
                      <OrderHistoryItem key={order.id} item={order} index={i} />
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
        </section>
      </main>
      <Footer />
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
      className="mt-[24px] rounded-[6px] bg-[#F7F4EF] px-[24px] py-[72px] text-center"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
    >
      <h2 className="text-[26px] sm:text-[34px]" style={LUXE}>
        {title}
      </h2>
      <p className="mx-auto mt-[12px] max-w-[420px] text-[14px] leading-relaxed text-[#6b6b6b]">
        {body}
      </p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-[26px] inline-flex h-[50px] items-center justify-center rounded-[10px] bg-[#121212] px-[34px] text-[12px] font-bold tracking-[0.14em] text-white uppercase transition-all duration-300 hover:bg-[#2a2a2a] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] active:scale-[0.98]"
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: EASE,
      }}
    >
      <motion.div
        className="flex w-full gap-x-[18px] rounded-[6px] bg-[#F7F4EF] p-[14px] sm:p-[16px]"
        whileHover={{
          boxShadow: '0 18px 40px -26px rgba(0,0,0,0.35)',
        }}
        transition={{ duration: 0.3 }}
      >
        {/* The piece, plated on ivory like the wardrobe rail */}
        <div className="relative size-[104px] shrink-0 overflow-hidden rounded-[3px] bg-[#EFEAE2] sm:size-[120px]">
          {firstItemImage ? (
            <img
              src={firstItemImage}
              alt={firstItemAlt}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-[34px] text-[#C9BEA9]" style={LUXE}>
                S
              </span>
            </div>
          )}
          {totalQuantity > 1 && (
            <span
              className="absolute top-[8px] right-[8px] rounded-full bg-white/85 px-[8px] py-[2px] text-[10px] font-medium tracking-[0.12em] text-[#1c1c1c] backdrop-blur-sm"
              title={`${totalQuantity} pieces in this order`}
            >
              ×{totalQuantity}
            </span>
          )}
        </div>

        {/* Ledger entry */}
        <div className="flex min-w-0 flex-1 flex-col justify-center py-[2px]">
          <div className="flex items-baseline justify-between gap-x-[12px]">
            <div className="truncate text-[18px] sm:text-[20px]" style={LUXE}>
              Order No. {orderNo}
            </div>
            <div className="shrink-0 text-[15px] font-medium sm:text-[16px]">
              {formatPrice(item.total)}
            </div>
          </div>
          <div
            className={`mt-[8px] text-[11px] tracking-[0.16em] uppercase ${statusTone(item.status)}`}
          >
            {item.status.replace(/_/g, ' ')}
          </div>
          <div className="mt-[4px] text-[11px] tracking-[0.14em] text-[#8E8E93] uppercase">
            Placed {placed}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
