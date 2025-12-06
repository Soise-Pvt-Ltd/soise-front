'use client';

import { useMemo, useState } from 'react';
import GridContainer from '../gridContainer';
import {
  AdminSoundLevelsIcon,
  AdminMoreHorizontalIcon,
  AdminSuccessCheckIcon,
  AdminCloseIcon,
} from '@/components/icons';
import Image from 'next/image';
import { faker } from '@faker-js/faker';

type PayoutStatus = 'Requested' | 'Approved' | 'Rejected';

interface Payout {
  id: number;
  creator: {
    name: string;
    avatar: string;
  };
  date: string;
  time: string;
  payout: number;
  status: PayoutStatus;
}

const createRandomPayout = (id: number): Payout => {
  const date = faker.date.past({ years: 1 });
  return {
    id: id,
    creator: {
      name: faker.person.fullName(),
      avatar: faker.image.avatar(),
    },
    date: date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    payout: faker.number.float(),
    status: faker.helpers.arrayElement(['Requested', 'Approved', 'Rejected']),
  };
};

const payoutData: Payout[] = Array.from({ length: 15 }, (_, i) =>
  createRandomPayout(i + 1),
);

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

  const [payouts, setPayouts] = useState<Payout[]>(payoutData);

  const filteredPayouts = useMemo(() => {
    if (activeTab === 'All') {
      return payouts;
    }
    return payouts.filter((payout) => payout.status === activeTab);
  }, [activeTab, payouts]);

  const handleAction = (id: number, newStatus: PayoutStatus) => {
    setPayouts((prevPayouts) =>
      prevPayouts.map((payout) =>
        payout.id === id ? { ...payout, status: newStatus } : payout,
      ),
    );
  };

  const renderActionButtons = (payout: Payout) => {
    switch (payout.status) {
      case 'Requested':
        return (
          <div className="flex items-center gap-x-2">
            <button
              onClick={() => handleAction(payout.id, 'Rejected')}
              className="flex h-[30px] items-center justify-center rounded-[6px] border border-[#AEAEB2] p-[6px]"
            >
              <AdminCloseIcon />
            </button>
            <button
              onClick={() => handleAction(payout.id, 'Approved')}
              className="flex h-[30px] items-center gap-x-[2px] rounded-[6px] border border-[#AEAEB2] p-[6px] font-medium"
            >
              <AdminSuccessCheckIcon />
              Approve
            </button>
          </div>
        );
      case 'Approved':
        return (
          <button className="flex h-[30px] items-center gap-x-[2px] rounded-full border border-[#CCEAD6] bg-[#CCEAD6] p-[6px] !pr-[8px] font-medium text-[#32AC5B]">
            <AdminSuccessCheckIcon />
            Approved
          </button>
        );
      case 'Rejected':
        return (
          <button className="flex h-[30px] items-center gap-x-[2px] rounded-[6px] border border-[#AEAEB2] p-[6px] font-medium !text-[#991C00]">
            <AdminCloseIcon />
            Rejected
          </button>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (filteredPayouts.length === 0) {
      return <div className="text-center text-gray-500">No payouts found.</div>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="text-medium min-w-full text-left text-[13px]">
          <thead>
            <tr>
              <th scope="col" className="thead">
                Creator
              </th>
              <th scope="col" className="thead">
                Date
              </th>
              <th scope="col" className="thead">
                Time
              </th>
              <th scope="col" className="thead">
                Payout
              </th>
              <th scope="col" className="thead">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPayouts.map((payout) => (
              <tr key={payout.id}>
                <td className="td">
                  <div className="flex items-center gap-x-[5px]">
                    <img
                      src={payout.creator.avatar}
                      alt={payout.creator.name}
                      className="size-8 rounded-full object-cover"
                    />
                    <span>{payout.creator.name}</span>
                  </div>
                </td>
                <td className="td">{payout.date}</td>
                <td className="td">{payout.time}</td>
                <td className="td">₦{payout.payout.toFixed(2)}</td>
                <td className="td">{renderActionButtons(payout)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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
                      <span className="absolute top-full left-0 z-10 h-[2px] w-full translate-y-[-2px] rounded-t-sm bg-gray-900 sm:translate-y-[5px]" />
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
        <div className="rounded-b-[20px] bg-white px-[24px]">
          {renderContent()}
        </div>
      </div>
    </GridContainer>
  );
}
