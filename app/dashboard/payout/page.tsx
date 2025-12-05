'use client';

import { useState } from 'react';
import GridContainer from '../gridContainer';
import {
  AdminSoundLevelsIcon,
  AdminMoreHorizontalIcon,
} from '@/components/icons';

export default function PayoutPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');

  const periodOptions = ['Daily', 'Weekly', 'Monthly'];
  const tabs = [
    { id: 'All', label: 'All' },
    { id: 'Requested', label: 'Requested' },
    { id: 'Rejected', label: 'Rejected' },
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
          <span className="text-[20px] font-medium">Payout</span>
        </div>
      </div>

      {/* 1st layer */}
      <div>
        <div className="rounded-[20px] bg-white px-[30px] py-[30px] text-[#121212]">
          <div className="grid grid-cols-1 divide-y divide-gray-200 md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="space-y-[16px] py-4 md:py-0 md:pr-6">
              <div className="flex items-center justify-between">
                <div className="text-[14px] text-[#AFB1B0]">Approved</div>
                <AdminMoreHorizontalIcon color="#35373C" />
              </div>
              <div className="text-[22px] font-medium">11</div>
              <div className="text-[14px] text-[#0072BB]">+4 vs last month</div>
            </div>
            <div className="space-y-[16px] py-4 md:px-6 md:py-0">
              <div className="flex items-center justify-between">
                <div className="text-[14px] text-[#AFB1B0]">Requested</div>
                <AdminMoreHorizontalIcon color="#35373C" />
              </div>
              <div className="text-[22px] font-medium">23</div>
              <div className="text-[14px] text-[#991C00]">+3 vs last month</div>
            </div>
            <div className="space-y-[16px] py-4 md:py-0 md:pl-6">
              <div className="flex items-center justify-between">
                <div className="text-[14px] text-[#AFB1B0]">Rejected</div>
                <AdminMoreHorizontalIcon color="#35373C" />
              </div>
              <div className="text-[22px] font-medium">23</div>
              <div className="text-[14px] text-[#AFB1B0]">0 vs last month</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2nd layer */}
      <div className="mt-[24px]">
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
            <div className="flex items-center gap-x-[22px]">
              <div className="pb-4">
                {' '}
                <input
                  type="text"
                  placeholder="Search creators..."
                  className="h-[36px] rounded-[10px] border-0 bg-[#F5F5F5] text-[12px] focus:ring-0 md:w-[245px]"
                />
              </div>

              <div className="flex items-center pb-4">
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
        </div>
        <div className="rounded-b-[20px] bg-white px-[24px] py-[30px] md:h-screen">
          {renderContent()}
        </div>
      </div>
    </GridContainer>
  );
}
