'use client';
import { useState } from 'react';
import GridContainer from '../gridContainer';
import { AdminSoundLevelsIcon } from '@/components/icons';

export default function CreatorsPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

  const periodOptions = ['Today', 'Weekly', 'Monthly'];
  return (
    <GridContainer>
      <div className="px-[16px]">
        <div className="py-[22px]">
          <span className="text-[20px] font-medium">Creators</span>
        </div>
      </div>

      <div className="">
        <div className="rounded-t-[20px] border-b border-[#AEAEB266]/40 bg-white px-[24px] py-[24px] text-[#121212]">
          <div className="flex flex-col items-center justify-between sm:flex-row">
            <div>
              {' '}
              <input
                type="text"
                placeholder="Search creators..."
                className="h-[36px] rounded-[10px] border-0 bg-[#F5F5F5] text-[12px] focus:ring-0 md:w-[245px]"
              />
            </div>

            <div className="relative flex items-center">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="btn_admin_outline flex items-center gap-x-[2px]"
              >
                <AdminSoundLevelsIcon />
                {selectedPeriod}
              </button>
              {isDropdownOpen && (
                <div className="ring-opacity-6 absolute top-full right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white ring-1 ring-gray-200">
                  <div className="py-1">
                    {periodOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSelectedPeriod(option);
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#AFB1B0] hover:bg-gray-100 hover:text-gray-400"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-b-[20px] bg-white px-[24px] py-[30px] md:h-screen"></div>
      </div>
    </GridContainer>
  );
}
