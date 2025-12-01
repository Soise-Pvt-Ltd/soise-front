'use client';

import { useState } from 'react';
import { ArrowLeftIcon, MenuIcon } from '@/components/icons';
import Image from 'next/image';
import Menu from './dashboard/Menu';

export default function CreatorsApplication() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="profile mx-auto mb-[119px] px-[16px] md:max-w-7xl">
        <div className="xs:gap-y-0 flex flex-wrap items-center justify-between gap-y-4 pt-[51px] pb-[28px]">
          <div>
            <ArrowLeftIcon />
          </div>
          <Image src="/logo.png" alt="Soise Logo" width={100} height={58} />
          <div
            onClick={() => setIsMenuOpen(true)}
            className="hover:cursor-pointer"
          >
            <MenuIcon />
          </div>
        </div>
        <div className="mt-[24px]">
          <h1 className="text-[16px] uppercase">Account Management</h1>
          <div className="mt-[24px] mb-[18px] space-y-[16px]">
            <div>
              <label>First Name</label>
              <input type="text" className="solid" placeholder="John" />
            </div>
            <div>
              <label>Last Name</label>
              <input type="text" className="solid" placeholder="Sosie" />
            </div>
            <div>
              <label>Email</label>
              <input
                type="text"
                className="solid"
                placeholder="boy@example.com"
              />
            </div>
            <div>
              <label>Portfolio URL</label>
              <input type="text" className="solid" placeholder="link" />
            </div>

            <div>
              <label>Bio</label>
              <input
                type="text"
                className="solid"
                placeholder="type a short description about yourself"
              />
            </div>
            <div>
              <label>Niche</label>
              <input
                type="text"
                className="solid"
                placeholder="what's your niche"
              />
            </div>
          </div>

          <button className="btn_black mt-[40px]">Save Password</button>
        </div>
      </div>
      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        showMenuItems={false}
      />
    </>
  );
}
