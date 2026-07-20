'use client';

import { useState, useEffect, ReactNode } from 'react';
import Nav from './nav';
import Image from 'next/image';
import AdminGlobalSearch from './AdminGlobalSearch';
import { useRouter } from 'next/navigation';
import { ToastContainer } from './toast';

interface GridContainerProps {
  children: ReactNode;
  user?: { username?: string; [key: string]: unknown };
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
          <Image src="/main-logo.png" alt="Soise" width={50} height={50} priority />
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
        <div className="min-h-screen bg-[#f9f9f9]">
          <div className="grid grid-cols-1 lg:h-screen lg:grid-cols-5 lg:overflow-hidden">
            <div className="col-span-1 hidden h-screen bg-white lg:inline-block">
              <button
                className="cursor-pointer pt-[28px] pb-[24px] pl-[18px] outline-none focus-visible:ring-2 focus-visible:ring-[#0072BB] focus-visible:ring-offset-2"
                onClick={() => router.push('/')}
                aria-label="Go to homepage"
              >
                <Image
                  src="/main-logo.png"
                  alt="Soise"
                  width={78}
                  height={78}
                  priority
                />
              </button>

              <Nav />
            </div>

            <div className="scrollbar-hide col-span-1 block min-h-screen overflow-y-auto lg:col-span-4">
              <div className="flex flex-col justify-between p-6 text-left lg:flex-row lg:items-center">
                <h1 className="mb-2 text-[22px] font-medium !text-[#121212] lg:mb-0">
                  Hello, {userName}!
                </h1>
                <AdminGlobalSearch />
              </div>
              <div className="px-6 pb-6">{children}</div>
            </div>
          </div>
        </div>
      </>
      <ToastContainer />
    </>
  );
};

export default GridContainer;
