'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { InfoIcon, CalenderIcon } from '@/components/icons';
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

export default function OrderHistoryClient({
  orders,
}: OrderHistoryClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>(
    'pending',
  );

  // Filter orders by payment status: pending_payment, created = pending; paid, completed = completed
  const pendingOrders = orders.filter((order) => 
    order.status === 'pending_payment' || order.status === 'created'
  );
  const completedOrders = orders.filter((order) => 
    order.status === 'paid' || order.status === 'completed'
  );

  return (
    <>
      <div className="mx-auto px-[16px] md:max-w-7xl">
        <div className="pb-[50px]">
          <motion.div
            className="flex justify-between pt-[12px] pb-[36px]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="font-display text-[22px]">Order History</div>
            <button className="cursor-pointer">
              <InfoIcon />
            </button>
          </motion.div>
          <div className="relative flex items-center gap-[10px] border-b border-[#AEAEB2] text-[12px] text-[#8E8E93] uppercase">
            {(['pending', 'completed'] as const).map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative cursor-pointer px-[10px] pb-1 transition-colors duration-200 ${
                  activeTab === tab
                    ? 'font-medium text-[#121212]'
                    : 'text-[#8E8E93] hover:text-[#121212]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] w-full bg-[#121212]"
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
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {pendingOrders.length > 0 ? (
                  <div className="mt-[24px] space-y-[24px]">
                    {pendingOrders.map((order, i) => (
                      <OrderHistoryItem
                        key={order.id}
                        item={order}
                        index={i}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    className="mt-[80px] mb-[164px] flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                  >
                    <div className="flex w-[208px] flex-col items-center text-center">
                      <CalenderIcon />
                      <div className="mt-[20px] gap-y-[16px]">
                        <p className="text-[16px] font-semibold">
                          No pending orders
                        </p>
                        <p className="text-[14px] text-[#8E8E93]">
                          You currently have no pending orders.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
            {activeTab === 'completed' && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mt-[24px] space-y-[24px]">
                  {completedOrders.length > 0 ? (
                    completedOrders.map((order, i) => (
                      <OrderHistoryItem
                        key={order.id}
                        item={order}
                        index={i}
                      />
                    ))
                  ) : (
                    <motion.div
                      className="flex-col items-center justify-center text-center text-xl text-[#8E8E93]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      Order history is empty
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </>
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
  
  // Get first item's variant image
  const firstItemImage = item.items[0]?.variant?.media?.[0]?.variants?.medium;
  const firstItemAlt = item.items[0]?.variant?.media?.[0]?.alt_text || 'Product image';
  
  const { formatPrice } = useCurrency();
  
  return (
    <motion.div
      className="h-[120px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="flex w-full gap-x-[16px]">
        <motion.div
          className="relative size-[120px] rounded-[6px] bg-[#f5f5f5] overflow-hidden"
          whileHover={{
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between absolute inset-0 z-10">
            <div></div>
            <div className="m-[8px] flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] bg-[#121212] px-1 text-center text-[12px] text-white">
              {totalQuantity}
            </div>
          </div>
          {firstItemImage && (
            <img
              src={firstItemImage}
              alt={firstItemAlt}
              className="absolute inset-0 h-full w-full rounded-[6px] object-cover"
            />
          )}
        </motion.div>
        <div className="w-full py-[3px]">
          <div className="mb-[16px] flex items-center justify-between">
            <div className="flex-wrap truncate font-medium uppercase">
              Order #{item.id.substring(0, 7)}
            </div>
            <div className="font-medium">{formatPrice(item.total)}</div>
          </div>
          <div className="text-[#8E8E93] text-[13px]">
            <div className="flex items-center gap-x-1">
              Status: <span className="uppercase font-medium text-[#121212]">{item.status.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-x-1">
              Date:{' '}
              <span>
                {new Date(item.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
