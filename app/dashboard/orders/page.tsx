'use client';

import GridContainer from '../gridContainer';
import { useState } from 'react';
import { AdminSoundLevelsIcon } from '@/components/icons';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('All');

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

      <div className="">
        <div className="rounded-t-[20px] border-b border-[#AEAEB266]/40 bg-white px-[24px] pt-[24px] text-[#121212]">
          <div className="flex items-center justify-between sm:flex-row">
            {/* Tabs */}
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
                      <span className="absolute -bottom-[1px] left-0 z-10 h-[2px] w-full rounded-t-sm bg-gray-900" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Button */}
            <div className="flex items-center">
              <button className="btn_admin_outline flex items-center gap-x-[2px]">
                <AdminSoundLevelsIcon />
                Daily
              </button>
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
