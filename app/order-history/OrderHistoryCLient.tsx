'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { InfoIcon, CalenderIcon } from '@/components/icons';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Image from 'next/image';

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

  const order_history = [
    {
      name: 'Street hoodie',
      color: 'black',
      size: 'M',
      quantity: 1,
      price: 59,
      image: '/hoodie.png',
      date: '2023/10/26',
    },
    {
      name: 'Cross Denim',
      color: 'blue',
      size: 'L',
      quantity: 2,
      price: 99,
      image: '/crossdenim.png',
      date: '2023/10/25',
    },
    {
      name: 'Bally Bomber',
      color: 'Green',
      size: 'XL',
      quantity: 1,
      price: 120,
      image: '/ballybomber.png',
      date: '2023/10/24',
    },
    {
      name: 'Get the Bread Tee',
      color: 'White',
      size: 'M',
      quantity: 3,
      price: 45,
      image: '/getthebreadtee.png',
      date: '2023/10/23',
    },
    {
      name: 'Stripe Hoodie',
      color: 'Black/White',
      size: 'S',
      quantity: 1,
      price: 65,
      image: '/stripehoodie.png',
      date: '2023/10/22',
    },
  ];

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
          {completed && (
            <div className="mt-[24px] space-y-[24px]">
              {order_history.length > 0 ? (
                order_history.map((item, index) => (
                  <OrderHistoryItem key={index} item={item} />
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

function OrderHistoryItem({ item }: any) {
  return (
    <div className="h-[120px]">
      <div className="flex w-full gap-x-[16px]">
        <div className="relative h-[120px] w-[100px] rounded-[6px] bg-[#f5f5f5]">
          <div className="flex justify-between">
            <div></div>
            <div className="z-10 m-[8px] flex h-[18px] w-[18px] items-center justify-center rounded-[4px] bg-[#121212] text-center text-[12px] text-white">
              {item.quantity}
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
              {item.name}
            </div>
            <div className="font-medium">${item.price}</div>
          </div>
          <div className="text-[#8E8E93]">
            <div className="flex items-center gap-x-1">
              Color: <span className="uppercase">{item.color}</span>
            </div>
            <div className="flex items-center gap-x-1">
              Size: <span className="uppercase">{item.size}</span>
            </div>
            <div className="flex items-center gap-x-1">
              Date: <span className="uppercase">{item.date}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
