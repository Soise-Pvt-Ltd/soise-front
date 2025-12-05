'use client';

import { useState } from 'react';
import { AdminSoundLevelsIcon } from '@/components/icons';
import GridContainer from '../gridContainer';
import { faker } from '@faker-js/faker';

export default function UsersPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

  const periodOptions = ['Today', 'Weekly', 'Monthly'];
  const users = Array.from({ length: 10 }, () => ({
    name: faker.person.fullName(),
    phoneNumber: faker.phone.number(),
    email: faker.internet.email(),
    orderNumber: faker.string.alphanumeric(8).toUpperCase(),
  }));

  return (
    <GridContainer>
      <div className="px-[16px]">
        <div className="py-[22px]">
          <span className="text-[20px] font-medium">Users</span>
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
                <div className="ring-opacity-6 absolute top-full right-0 z-30 mt-2 w-32 origin-top-right rounded-md bg-white ring-1 ring-gray-200">
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
        <div className="rounded-b-[20px] bg-white px-[24px] py-[30px]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                  >
                    Phone Number
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                  >
                    Order Number
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((user) => (
                  <tr key={user.email}>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {user.phoneNumber}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {user.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <a
                        href="#"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </GridContainer>
  );
}
