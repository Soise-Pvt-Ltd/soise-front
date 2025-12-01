'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { InfoIcon, CalenderIcon } from '@/components/icons';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Image from 'next/image';

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
  items: {
    id: string;
    line_total: number;
    quantity: number;
    unit_price: number;
    variant: string; // This might contain more info to get product details
  }[];
}

interface OrderHistoryClientProps {
  orders: Order[];
}

export default function OrderHistoryClient({
  orders,
}: OrderHistoryClientProps) {
  const router = useRouter();
  const [pending, setPending] = useState(true);
  const [completed, setCompleted] = useState(false);

  const pendingOrders = orders.filter((order) => order.status !== 'paid');
  const completedOrders = orders.filter((order) => order.status === 'paid');

  return (
    <>
      <Nav />
      <div className="mx-auto px-[16px] md:max-w-7xl">
        <div className="pb-[50px]">
          <div className="flex justify-between pt-[12px] pb-[36px]">
            <div className="font-display text-[22px]">Order History</div>
            <button className="cursor-pointer">
              <InfoIcon />
            </button>
          </div>
          <div className="flex items-center gap-[10px] border-b border-[#AEAEB2] text-[12px] text-[#8E8E93] uppercase">
            <div
              onClick={() => {
                setPending(true);
                setCompleted(false);
              }}
              className={`cursor-pointer px-[10px] pb-1 ${
                pending
                  ? 'border-b-2 border-[#121212] font-medium text-[#121212]'
                  : 'text-[#8E8E93]'
              }`}
            >
              Pending
            </div>
            <div
              className={`cursor-pointer px-[10px] pb-1 ${
                completed
                  ? 'border-b-2 border-[#121212] font-medium text-[#121212]'
                  : 'text-[#8E8E93]'
              }`}
              onClick={() => {
                setPending(false);
                setCompleted(true);
              }}
            >
              Completed
            </div>
          </div>
          {pending && (
            <>
              {pendingOrders.length > 0 ? (
                <div className="mt-[24px] space-y-[24px]">
                  {pendingOrders.map((order) => (
                    <OrderHistoryItem key={order.id} item={order} />
                  ))}
                </div>
              ) : (
                <>
                  <div className="mt-[80px] mb-[164px] flex items-center justify-center">
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
                  </div>
                </>
              )}
            </>
          )}
          {completed && (
            <div className="mt-[24px] space-y-[24px]">
              {completedOrders.length > 0 ? (
                completedOrders.map((order) => (
                  <OrderHistoryItem key={order.id} item={order} />
                ))
              ) : (
                <div className="flex-col items-center justify-center text-center text-xl text-[#8E8E93]">
                  Order history is empty
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

function OrderHistoryItem({ item }: { item: Order }) {
  const totalQuantity = item.items.reduce(
    (sum, current) => sum + current.quantity,
    0,
  );
  return (
    <div className="h-[120px]">
      <div className="flex w-full gap-x-[16px]">
        <div className="relative h-[120px] w-[100px] rounded-[6px] bg-[#f5f5f5]">
          <div className="flex justify-between">
            <div></div>
            <div className="z-10 m-[8px] flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] bg-[#121212] px-1 text-center text-[12px] text-white">
              {totalQuantity}
            </div>
          </div>
          {/* <Image
            src={null}
            alt={item.name}
            fill
            style={{ objectFit: 'cover' }}
            className="rounded-[6px]"
          /> */}
        </div>
        <div className="w-full py-[3px]">
          <div className="mb-[16px] flex items-center justify-between">
            <div className="flex-wrap truncate font-medium uppercase">
              Order #{item.id.substring(0, 7)}
            </div>
            <div className="font-medium">${item.total.toFixed(2)}</div>
          </div>
          <div className="text-[#8E8E93]">
            <div className="flex items-center gap-x-1">
              Status: <span className="uppercase">{item.status}</span>
            </div>
            <div className="flex items-center gap-x-1">
              Date:{' '}
              <span className="uppercase">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
