'use client';

import { useState } from 'react';
import {
  AdminSoundLevelsIcon,
  AdminMoreVerticalIcon,
} from '@/components/icons';
import GridContainer from '../gridContainer';
import { faker } from '@faker-js/faker';

export default function UsersPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

  const periodOptions = ['Today', 'Weekly', 'Monthly'];
  const users = Array.from({ length: 10 }, () => ({
    // name: faker.person.fullName(),
    // phoneNumber: faker.phone.number(),
    name: 'Samuel Okoro',
    phoneNumber: '0987654312',
    email: faker.internet.email(),
    numberOfOrders: faker.number.int({ min: 1, max: 100 }),
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
          <div className="flex items-center justify-between">
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
        <div className="rounded-b-[20px] bg-white px-[24px]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr>
                  <th scope="col" className="thead">
                    Name
                  </th>
                  <th scope="col" className="thead">
                    Phone Number
                  </th>
                  <th scope="col" className="thead">
                    Email
                  </th>
                  <th scope="col" className="thead">
                    No. of Orders
                  </th>
                  <th scope="col" className="thead">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.email}>
                    <td className="td">{user.name}</td>
                    <td className="td">{user.phoneNumber}</td>
                    <td className="td">{user.email}</td>
                    <td className="td">{user.numberOfOrders}</td>
                    <td className="td">
                      <button className="flex size-[25px] cursor-pointer items-center justify-center rounded-[6px] bg-[#F5F5F5]">
                        <AdminMoreVerticalIcon />
                      </button>
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
