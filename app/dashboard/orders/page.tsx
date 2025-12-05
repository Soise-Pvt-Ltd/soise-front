'use client';

import GridContainer from '../gridContainer';
import { useState } from 'react';
import { AdminSoundLevelsIcon } from '@/components/icons';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');

  const periodOptions = ['Daily', 'Weekly', 'Monthly'];
  const tabs = [
    { id: 'All', label: 'All' },
    { id: 'Delivered', label: 'Delivered' },
    { id: 'Pending', label: 'Pending' },
    { id: 'Failed', label: 'Failed' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'All':
        return <div></div>;
      case 'Delivered':
        return <div></div>;
      case 'Pending':
        return <div></div>;
      case 'Failed':
        return <div></div>;
      default:
        return null;
    }
  };

  return (
    <GridContainer>
      <div className="px-[16px]">
        <div className="py-[22px]">
          <span className="text-[20px] font-medium">Orders</span>
        </div>
      </div>

      <>
        <div className="rounded-t-[20px] border-b border-[#AEAEB266]/40 bg-white px-[24px] pt-[24px] text-[#121212]">
          <div className="scrollbar-hide relative flex flex-col-reverse items-start justify-between gap-4 overflow-visible sm:flex-row sm:items-center">
            <div className="flex items-center gap-8">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative cursor-pointer pb-4 text-[14px] transition-all duration-200 ease-in-out ${
                      isActive
                        ? 'text-gray-900'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute top-full left-0 z-10 h-[2px] w-full translate-y-[-2px] rounded-t-sm bg-gray-900 sm:translate-y-[4px]" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="relative flex items-center pb-4">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="btn_admin_outline flex items-center gap-x-[2px]"
              >
                <AdminSoundLevelsIcon />
                {selectedPeriod}
              </button>
              {isDropdownOpen && (
                <div className="ring-opacity-6 absolute top-full right-0 z-10 -mt-2 w-32 origin-top-right rounded-md bg-white ring-1 ring-gray-200">
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
        <div className="rounded-b-[20px] bg-white px-[24px] py-[30px] md:h-screen">
          {renderContent()}
        </div>
      </>
    </GridContainer>
  );
}
