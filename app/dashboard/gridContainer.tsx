'use client';

import { useState, useEffect, ReactNode } from 'react';
import Nav from './nav';
import Image from 'next/image';
import { AdminSearchIcon, AdminNotificationIcon } from '@/components/icons';

interface GridContainerProps {
  children: ReactNode;
}

const GridContainer = ({ children }: GridContainerProps) => {
  const [open, setOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0,
  );

  const toggleMenu = () => {
    setOpen(!open);
  };

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setScreenWidth(newWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <div className="flex items-center justify-between p-[24px] lg:hidden">
        <div>
          <Image src="/logo.png" alt="Soise Logo" width={100} height={58} />
        </div>
        <div
          className="cursor-pointer bg-white text-[#35373C]"
          onClick={() => setOpen(!open)}
        >
          {!open && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path
                fillRule="evenodd"
                d="M3 9a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 9Zm0 6.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {screenWidth < 1024 && (
        <>
          {open && (
            <div
              className="fixed top-0 left-0 z-10 h-full w-full bg-black/80"
              onClick={toggleMenu}
            ></div>
          )}

          {open && (
            <div
              className={`fixed top-0 left-0 z-20 h-full w-80 transform bg-white py-4 transition-transform ${
                open ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <Nav />
            </div>
          )}
          {open && (
            <button
              onClick={toggleMenu}
              className="fixed top-4 left-80 z-20 ml-4 cursor-pointer text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8"
              >
                <path
                  fillRule="evenodd"
                  d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </>
      )}
      <>
        <div className="bg-[#e5e5e5] p-[14px]">
          <div className="grid grid-cols-1 rounded-3xl bg-[#f9f9f9] lg:h-screen lg:grid-cols-5 lg:overflow-hidden">
            <div className="col-span-1 my-[12px] ml-[12px] hidden justify-center rounded-[20px] bg-white lg:inline-block">
              <div className="pt-[28px] pb-[24px] pl-[18px]">
                <Image
                  src="/logo.png"
                  alt="Soise Logo"
                  width={100}
                  height={58}
                />
              </div>

              <Nav />
            </div>

            <div className="scrollbar-hide col-span-1 block min-h-screen overflow-y-auto py-[12px] lg:col-span-4 lg:mx-[28px]">
              <div className="mx-[13px] flex flex-col justify-between rounded-[20px] bg-white p-[16px] text-left lg:flex-row lg:items-center">
                <div className="mb-2 text-[22px] font-medium lg:mb-0">
                  Hello, Dylee!
                </div>
                <div className="flex items-center space-x-[16px]">
                  <div className="flex h-[46px] w-full items-center space-x-2 rounded-[10px] bg-[#F2EFEF] pr-[15px] lg:w-fit">
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-full border-0 bg-transparent text-[14px] placeholder:text-[#9A9A9A] focus:ring-0"
                    />
                    <AdminSearchIcon />
                  </div>
                  <div>
                    <button className="h-[46px] rounded-[10px] bg-[#F2EFEF] p-[15px] hover:cursor-pointer">
                      <AdminNotificationIcon />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mx-[13px]">{children}</div>
            </div>
          </div>
        </div>
      </>
    </>
  );
};

export default GridContainer;
