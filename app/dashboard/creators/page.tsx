'use client';
import { useEffect, useState } from 'react';
import GridContainer from '../gridContainer';
import {
  AdminSoundLevelsIcon,
  AdminMoreVerticalIcon,
  AdminBadge1,
  AdminBadge2,
  AdminBadge3,
} from '@/components/icons';
import { faker } from '@faker-js/faker';

type Creator = {
  id: string;
  name: string;
  avatar: string;
  tier: 'tier 1' | 'tier 2' | 'tier 3';
  email: string;
  salesGenerated: string;
};

export default function CreatorsPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [creators, setCreators] = useState<Creator[]>([]);

  const periodOptions = ['Today', 'Weekly', 'Monthly'];

  useEffect(() => {
    const newCreators: Creator[] = Array.from({ length: 10 }, () => {
      return {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        avatar: faker.image.avatar(),
        tier: faker.helpers.arrayElement(['tier 1', 'tier 2', 'tier 3']),
        email: faker.internet.email(),
        salesGenerated: faker.finance.amount(),
      };
    });
    setCreators(newCreators);
  }, []);

  const renderContent = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-[13px]">
        <thead>
          <tr>
            <th scope="col" className="thead truncate">
              Creator
            </th>
            <th scope="col" className="thead">
              Tier
            </th>
            <th scope="col" className="thead">
              Email
            </th>
            <th scope="col" className="thead">
              Sales Generated
            </th>
            <th scope="col" className="thead">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {creators.map((creator) => (
            <tr key={creator.id}>
              <td className="td">
                <div className="flex items-center gap-x-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="size-8 rounded-full object-cover"
                  />
                  <span>{creator.name}</span>
                </div>
              </td>
              <td className="td">
                <div className="flex items-center gap-x-1.5">
                  <span
                    style={{
                      color:
                        creator.tier === 'tier 1'
                          ? '#CD7F32'
                          : creator.tier === 'tier 2'
                            ? '#C0C0C0'
                            : '#FFEB80',
                    }}
                    className="capitalize"
                  >
                    {creator.tier}
                  </span>
                  {creator.tier === 'tier 1' && <AdminBadge1 />}
                  {creator.tier === 'tier 2' && <AdminBadge2 />}
                  {creator.tier === 'tier 3' && <AdminBadge3 />}
                </div>
              </td>
              <td className="td">{creator.email}</td>
              <td className="td">₦{creator.salesGenerated}</td>
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
  );

  return (
    <GridContainer>
      <div className="px-[16px]">
        <div className="py-[22px]">
          <span className="text-[20px] font-medium">Creators</span>
        </div>
      </div>

      <div className="">
        <div className="rounded-t-[20px] border-b border-[#AEAEB266]/40 bg-white px-[24px] py-[24px] text-[#121212]">
          <div className="flex flex-row items-center justify-between">
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

        {creators.length > 0 ? (
          <div className="h-full rounded-b-[20px] bg-white px-[24px]">
            {renderContent()}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-b-[20px] bg-white px-[24px] py-[30px] md:h-screen">
            <span className="text-base text-gray-500">
              There are no creators to display.
            </span>
          </div>
        )}
      </div>
    </GridContainer>
  );
}
