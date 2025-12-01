'use client';

import { useState, useEffect, ReactNode } from 'react';
import Nav from './nav';

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
      <div className="border-sec border-b-tertblue bg-priblue flex items-center justify-between border-b p-3 lg:hidden">
        <div>
          <a href="/" className="text-textgold text-2xl">
            {process.env.NEXT_PUBLIC_NAME}
          </a>
        </div>
        <div
          className="cursor-pointer text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
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
              className="fixed top-0 left-0 z-10 h-full w-full bg-black opacity-20"
              onClick={toggleMenu}
            ></div>
          )}

          {open && (
            <>
              <div
                className={`border-l-tertblue bg-priblue text-textwhite fixed top-0 right-0 z-10 h-full w-80 transform border-l transition-transform ${
                  open ? 'translate-x-0' : 'translate-x-full'
                }`}
              >
                {' '}
                <Nav />
              </div>
            </>
          )}
        </>
      )}
      <>
        <div className="grid grid-cols-1 lg:h-screen lg:grid-cols-5 lg:overflow-hidden">
          <div className="border-tertblue bg-priblue col-span-1 flex hidden h-full justify-center border-r py-10 lg:inline-block lg:h-screen">
            <Nav />
          </div>

          <div className="bg-priblue col-span-1 block min-h-screen overflow-y-auto px-5 py-10 lg:col-span-4 lg:min-h-0 lg:px-10">
            {children}
          </div>
        </div>
      </>
    </>
  );
};

export default GridContainer;
