'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { ArrowUpIcon, ArrowDownIcon } from '@/components/icons';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Image from 'next/image';

interface Order {
  id: string | number;
  title: string;
  price: number;
  thumbnail: string;
}
interface OrderSummaryClientProps {
  products: Order[];
}

// export default function OrderSummaryClient({
//   products: order,
// }: OrderSummaryClientProps) {

export default function OrderSummaryClient() {
  const router = useRouter();
  const [pending, setPending] = useState(true);
  const [completed, setCompleted] = useState(false);

  const [show, setShow] = useState(true);

  const order_summary = [
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
          <div className="flex items-center justify-between border-y border-[#AEAEB2] px-[20px] py-[25px]">
            <div className="flex items-center gap-x-2 text-[10px] uppercase">
              Order Summary{' '}
              {show ? (
                <div onClick={() => setShow(false)} className="cursor-pointer">
                  <ArrowUpIcon />
                </div>
              ) : (
                <div onClick={() => setShow(true)} className="cursor-pointer">
                  <ArrowDownIcon />
                </div>
              )}
            </div>
            <div className="text-[16px] font-medium">
              $
              {order_summary
                .reduce((acc, item) => acc + item.price * item.quantity, 0)
                .toFixed(0)}
            </div>
          </div>

          {show && (
            <div className="mt-[24px] space-y-[24px]">
              {order_summary.length > 0 ? (
                order_summary.map((item, index) => (
                  <OrderSummaryItem key={index} item={item} />
                ))
              ) : (
                <div className="flex-col items-center justify-center text-center text-xl text-[#8E8E93]">
                  No orders
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-[20px]">
          <div className="flex gap-x-2">
            <input
              type="text"
              className="outlined"
              placeholder="Discount code"
            />
            <button className="btn_black !w-fit !px-10">apply</button>
          </div>
          <div className="pt-[24px] uppercase">
            <div className="flex items-center justify-between text-[12px] text-[#8E8E93]">
              <div>Subtotal</div>
              <div>$177</div>
            </div>
            <div className="flex items-center justify-between pt-[12px] text-[14px] font-medium text-[#121212]">
              <div>Total</div>
              <div>$177</div>
            </div>
          </div>
        </div>

        <div className="my-[24px] border-t border-[#AEAEB2]"></div>

        <div className="px-[20px]">
          <div className="mb-[36px]">
            <div>
              <h1 className="text-[16px] font-bold uppercase">Delivery</h1>
              <div className="mt-[24px] mb-[18px] space-y-[10px]">
                <select className="form-select solid">
                  <option>Nigeria</option>
                </select>
                <input type="text" className="solid" placeholder="First Name" />
                <input type="text" className="solid" placeholder="Last Name" />
                <input type="text" className="solid" placeholder="Address" />
                <input type="text" className="solid" placeholder="City" />
                <input type="text" className="solid" placeholder="State" />
                <input type="text" className="solid" placeholder="ZIP code" />
                <input type="text" className="solid" placeholder="Phone" />
              </div>

              <button className="btn_outline">Save Changes</button>
            </div>
          </div>

          <div>
            <div className="pb-[24px]">
              <h1 className="text-[16px] font-bold uppercase">Payment</h1>
              <p className="text-[13px] text-[#8E8E93]">
                All transactions are secure and encrypted.
              </p>
            </div>

            <div className="flex items-center gap-x-[8px] rounded-t-[20px] border border-[#AEAEB2] px-[16px] py-[20px]">
              <input type="radio" />{' '}
              <span className="text-[13px]">Credit card</span>
            </div>
            <div className="space-y-[10px] rounded-b-[10px] border-0 border-x border-b border-[#AEAEB2] px-[16px] pt-[26px] pb-[23px]">
              <input
                type="text"
                className="outlined"
                placeholder="Card number"
              />
              <input
                type="text"
                className="outlined"
                placeholder="Expiration date (MM / YY)"
              />
              <input
                type="text"
                className="outlined"
                placeholder="Security code"
              />
              <input
                type="text"
                className="outlined"
                placeholder="Name on card"
              />
              <div className="flex items-center gap-x-3">
                <input type="checkbox" /> Save card
              </div>
            </div>
          </div>

          <button className="btn_black mt-[36px]">pay now</button>
        </div>
      </div>
      <Footer />
    </>
  );
}

function OrderSummaryItem({ item }: any) {
  return (
    <div className="h-[120px] px-[20px]">
      <div className="flex w-full justify-between gap-x-[16px]">
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
        <div className="flex w-full justify-between">
          <div className="flex flex-col py-[3px] text-[14px]">
            <div className="flex-wrap pb-[16px] font-medium uppercase">
              {item.name}
            </div>
            <div className="text-[#8E8E93]">
              <div>
                Color: <span className="uppercase">{item.color}</span>
              </div>
              <div>
                Size: <span className="uppercase">{item.size}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between py-[3px] text-right text-[14px]">
            <div>${item.price}</div>
            <div className="cursor-pointer uppercase underline hover:no-underline">
              Remove
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
