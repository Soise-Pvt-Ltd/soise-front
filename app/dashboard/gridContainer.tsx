'use client';

import { useState, useEffect, ReactNode } from 'react';
import Nav from './nav';
import Image from 'next/image';
import { AdminSearchIcon, AdminNotificationIcon } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { ToastContainer } from './toast';

interface GridContainerProps {
  children: ReactNode;
  user?: any;
}

const GridContainer = ({ children, user }: GridContainerProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0,
  );

  const userName = user?.username || 'Admin';

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

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  return (
    <>
      <header className="flex items-center justify-between p-[24px] lg:hidden">
        <button onClick={() => router.push('/')} className="cursor-pointer" aria-label="Go to homepage">
          <Image src="/logo.png" alt="Soise Logo" width={100} height={58} />
        </button>
        <button
          className="flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-[10px] bg-white text-[#35373C] outline-none focus-visible:ring-2 focus-visible:ring-[#0072BB]"
          onClick={toggleMenu}
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
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
        </button>
      </header>

      {screenWidth < 1024 && (
        <>
          {open && (
            <div
              className="fixed top-0 left-0 z-70 h-full w-full bg-black/80"
              onClick={toggleMenu}
              aria-hidden="true"
            />
          )}

          {open && (
            <aside
              className={`fixed top-0 left-0 z-70 h-full w-80 transform bg-white py-4 transition-transform ${
                open ? 'translate-x-0' : '-translate-x-full'
              }`}
              role="navigation"
              aria-label="Main navigation"
            >
              <Nav />
            </aside>
          )}
          {open && (
            <button
              onClick={toggleMenu}
              className="fixed top-4 left-80 z-70 ml-4 flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close navigation menu"
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
              <button
                className="cursor-pointer pt-[28px] pb-[24px] pl-[18px] outline-none focus-visible:ring-2 focus-visible:ring-[#0072BB] focus-visible:ring-offset-2"
                onClick={() => router.push('/')}
                aria-label="Go to homepage"
              >
                <Image
                  src="/logo.png"
                  alt="Soise Logo"
                  width={100}
                  height={58}
                />
              </button>

              <Nav />
            </div>

            <div className="scrollbar-hide col-span-1 block min-h-screen overflow-y-auto py-[12px] lg:col-span-4 lg:mx-[28px]">
              <div className="mx-[13px] flex flex-col justify-between rounded-[20px] bg-white p-[16px] text-left lg:flex-row lg:items-center">
                <h1 className="mb-2 text-[22px] font-medium !text-[#121212] lg:mb-0">
                  Hello, {userName}!
                </h1>
                <div className="flex items-center space-x-2">
                  <div className="flex h-[44px] w-full items-center space-x-2 rounded-[10px] bg-[#F5F5F5] pr-[15px] lg:w-fit">
                    <input
                      type="text"
                      placeholder="Search"
                      aria-label="Search dashboard"
                      className="w-full border-0 bg-transparent text-[14px] placeholder:text-[#9A9A9A] outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#0072BB]"
                    />
                    <AdminSearchIcon />
                  </div>
                  <div>
                    <button
                      className="flex h-[44px] w-[44px] items-center justify-center rounded-[10px] bg-[#F5F5F5] outline-none transition-colors duration-150 hover:cursor-pointer hover:bg-[#EBEBEB] focus-visible:ring-2 focus-visible:ring-[#0072BB]"
                      aria-label="Notifications"
                    >
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
      <ToastContainer />
    </>
  );
};

export default GridContainer;
