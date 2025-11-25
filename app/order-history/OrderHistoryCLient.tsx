'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { InfoIcon, CalenderIcon } from '@/components/icons';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Link from 'next/link';

interface Order {
  id: string | number;
  title: string;
  price: number;
  thumbnail: string;
}
interface OrderHistoryClientProps {
  products: Order[];
}

export default function OrderHistoryClient({
  products: order,
}: OrderHistoryClientProps) {
  const router = useRouter();
  const [pending, setPending] = useState(true);
  const [completed, setCompleted] = useState(false);

  return (
    <>
      <Nav />
      <div className="mx-auto md:max-w-7xl">
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
              <div className="flex min-h-screen items-center justify-center">
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

              <div className="flex items-center justify-center">
                <button
                  className="btn_black md:!w-fit md:!px-10"
                  onClick={() => router.push('/product-listing')}
                >
                  Explore collection
                </button>
              </div>
            </>
          )}
          {completed && <div></div>}
        </div>
      </div>
      <Footer />
    </>
  );
}
