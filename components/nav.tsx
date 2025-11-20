'use client';

import { useState } from 'react';
import {
  MenuIcon,
  BagIcon,
  UserIcon,
  SearchIcon,
  CloseIcon,
  ArrowUpRightIcon,
  MinusIcon,
  PlusIcon,
} from './icons';
import Link from 'next/link';
import Image from 'next/image';

export default function Nav() {
  const [openMenu, setOpenMenu] = useState<null | 'menu' | 'search' | 'bag'>(
    null,
  );

  const trending_searches = [
    'Soise',
    'Street Soise',
    'The Bally Bomber',
    'Cross Denim',
    'Stripe Hoodie',
    'Get the Bread Tea',
  ];

  const menu_1 = [
    {
      name: 'T-shirts',
      href: '',
    },
    {
      name: 'Outerwear',
      href: '',
    },
    {
      name: 'Bottoms',
      href: '',
    },
    {
      name: 'Accessories',
      href: '',
    },
    {
      name: 'Wishlist',
      href: '/whishlist',
    },
  ];

  const menu_2 = [
    {
      name: 'Order History',
      href: '',
    },
    {
      name: 'Creator Experience',
      href: '',
      icon: <ArrowUpRightIcon />,
    },
    {
      name: 'Sign In',
      href: '/signin',
    },
  ];

  const bag_items = [
    {
      name: 'Street hoodie',
      color: 'black',
      size: 'M',
      quantity: 1,
      price: 59,
      image: '/hoodie.png',
    },
    {
      name: 'Cross Denim',
      color: 'blue',
      size: 'L',
      quantity: 2,
      price: 99,
      image: '/crossdenim.png',
    },
  ];

  return (
    <>
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-[20px] pt-[65px] pb-[40px] md:px-[40px]">
        <div className="flex items-center gap-x-[18px]">
          {/* Menu Open */}
          <button
            onClick={() => setOpenMenu('menu')}
            className="hover:cursor-pointer"
          >
            <MenuIcon />
          </button>

          {/* Search Open */}
          <button
            onClick={() => setOpenMenu('search')}
            className="hover:cursor-pointer"
          >
            <SearchIcon />
          </button>
        </div>

        <div className="font-display text-[29px] tracking-[0.2em] uppercase">
          soise
        </div>

        <div className="flex items-center gap-x-[18px]">
          {/* Bag Open */}
          <button
            onClick={() => setOpenMenu('bag')}
            className="hover:cursor-pointer"
          >
            <BagIcon />
          </button>

          <UserIcon />
        </div>
      </div>

      {/* ---------------- FULLSCREEN PANELS ---------------- */}

      {/* 1. Mobile Menu Panel */}
      {openMenu === 'menu' && (
        <FullscreenPanel openMenu={openMenu} onClose={() => setOpenMenu(null)}>
          <>
            <div className="space-y-[36px] px-[24px] !text-[13px] !font-medium text-[#121212] uppercase">
              {menu_1.map((item, index) => (
                <div key={index}>
                  <Link href={item.href} className="hover:cursor-pointer">
                    {item.name}
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-[112px] border-y border-[#AEAEB2] pb-[112px] text-[#121212]">
              <div className="space-y-[43px] px-[24px] pt-[40px]">
                {menu_2.map((item, index) => (
                  <div key={index}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 hover:cursor-pointer"
                    >
                      {item.name} {item.icon}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-[24px] pt-[40px] text-[13px] text-[#121212]">
              Country / Region: NG / English
            </div>
          </>
        </FullscreenPanel>
      )}

      {/* 2. Search Panel */}
      {openMenu === 'search' && (
        <FullscreenPanel openMenu={openMenu} onClose={() => setOpenMenu(null)}>
          <div className="px-[24px]">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by keyword"
                className="form-text w-full pr-16 !text-[13px]"
              />
              <button className="absolute top-1/2 right-[16px] -translate-y-1/2 !text-[13px] font-medium text-black">
                Search
              </button>
            </div>

            <div className="mt-[36px] space-y-[24px] text-[13px]">
              <div className="font-medium text-[#121212]">
                Trending Searches
              </div>
              <div className="space-y-[16px] text-[#8E8E93]">
                {trending_searches.map((item, index) => (
                  <div key={index}>{item}</div>
                ))}
              </div>
            </div>
          </div>
        </FullscreenPanel>
      )}

      {/* 3. Bag Panel */}
      {openMenu === 'bag' && (
        <FullscreenPanel openMenu={openMenu} onClose={() => setOpenMenu(null)}>
          <div className="flex h-full flex-col justify-between px-[24px]">
            <div className="overflow-y-auto">
              {bag_items.length > 0 ? (
                bag_items.map((item, index) => (
                  <BagItem key={index} item={item} />
                ))
              ) : (
                <div className="flex-col items-center justify-center text-center text-xl text-[#8E8E93]">
                  Your bag is empty
                </div>
              )}
            </div>
            <div className="pt-[32px]">
              <div className="flex justify-between !text-[12px] font-medium text-[#8E8E93] uppercase">
                <div>Subtotal: </div>
                <div>$218.00</div>
              </div>
              <div className="mt-[7.5px] flex justify-between !text-[14px] font-medium text-[#121212] uppercase">
                <div>Total: </div>
                <div>$218.00</div>
              </div>
              <div>
                <button className="btn_outline">Checkout</button>
              </div>
            </div>
          </div>
        </FullscreenPanel>
      )}
    </>
  );
}

/* ---------------- COMPONENT: Fullscreen Wrapper ---------------- */
function FullscreenPanel({ children, onClose, openMenu }: any) {
  return (
    <div className="text-primary fixed inset-0 z-50 flex min-h-screen w-full flex-col bg-white">
      {/* Panel Header */}
      <div className="flex justify-between px-[24px] pt-[70px] pb-[64px]">
        <div className="text-22px font-[var(--font-display)]">
          {openMenu === 'bag' && 'Shopping Bag'}
        </div>
        <button onClick={onClose} className="cursor-pointer">
          <CloseIcon />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto pb-[24px]">{children}</div>
    </div>
  );
}

function BagItem({ item }: any) {
  return (
    <div className="mb-[24px] flex h-[120px] justify-between">
      <div className="flex gap-x-[16px]">
        <div className="relative h-[120px] w-[100px] rounded-[6px] bg-[#f5f5f5]">
          <Image
            src={item.image}
            alt={item.name}
            fill
            style={{ objectFit: 'cover' }}
            className="rounded-[6px]"
          />
        </div>
        <div className="flex w-[105px] flex-col justify-between py-[3px] text-[14px]">
          <div className="flex-wrap font-medium uppercase">{item.name}</div>
          <div className="text-[#8E8E93]">
            <div>
              Color: <span className="uppercase">{item.color}</span>
            </div>
            <div>
              Size: <span className="uppercase">{item.size}</span>
            </div>
          </div>
          <div className="flex h-[36px] w-[96px] items-center justify-between rounded-[4px] border border-[#AEAEB2] p-[6px]">
            <MinusIcon />
            <div className="font-medium text-[#121212]">{item.quantity}</div>
            <PlusIcon />
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
  );
}
