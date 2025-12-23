'use client';

import { faker } from '@faker-js/faker';
import GridContainer from '../gridContainer';
import { useEffect, useState } from 'react';
import {
  AdminMoreVerticalIcon,
  AdminSoundLevelsIcon,
} from '@/components/icons';

type OrderStatus = 'Delivered' | 'Pending' | 'Failed';

type Order = {
  id: string;
  name: string;
  address: string;
  date: string;
  status: OrderStatus;
};

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

  const newOrders: Order[] = Array.from({ length: 10 }, () => {
    const date = faker.date.recent();
    return {
      id: `ORD-${faker.string.alphanumeric(8).toUpperCase()}`,
      name: faker.person.fullName(),
      address: faker.location.streetAddress(true),
      date: `${date.getDate()} ${date.toLocaleString('en-US', {
        month: 'short',
      })} ${date.getFullYear()}`,
      status: faker.helpers.arrayElement(['Delivered', 'Pending', 'Failed']),
    };
  });

  const statusClasses: Record<OrderStatus, string> = {
    Delivered:
      'bg-[#CCEAD6] text-[#32AC5B] border border-[#CCEAD6] rounded-full',
    Pending: 'bg-[#F5F1CC] text-[#D8C732] border border-[#F5F1CC] rounded-full',
    Failed: 'bg-[#E5C6BF] text-[#991C00] border border-[#E5C6BF] rounded-full',
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'All':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[13px]">
              <thead>
                <tr>
                  <th scope="col" className="thead truncate">
                    Name
                  </th>
                  <th scope="col" className="thead">
                    Address
                  </th>
                  <th scope="col" className="thead">
                    Order ID
                  </th>
                  <th scope="col" className="thead">
                    Date
                  </th>
                  <th scope="col" className="thead">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {newOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="td">{order.name}</td>
                    <td className="td">{order.address}</td>
                    <td className="td">{order.id}</td>
                    <td className="td">{order.date}</td>
                    <td className="td">
                      <span
                        className={`px-2 py-1 ${statusClasses[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
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
                      <span className="absolute top-full left-0 z-10 h-[2px] w-full translate-y-[-2px] rounded-t-sm bg-gray-900 sm:translate-y-[5px]" />
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
        {newOrders.length > 0 ? (
          <div className="h-full rounded-b-[20px] bg-white px-[24px]">
            {renderContent()}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-b-[20px] bg-white px-[24px] py-[30px] md:h-screen">
            <span className="text-base text-gray-500">
              There are no orders to display.
            </span>
          </div>
        )}
      </>
    </GridContainer>
  );
}
