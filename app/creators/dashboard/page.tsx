import { ChainIcon, TagIcon, DollarIcon } from '@/components/icons';
import ReferralCode from '../ReferralCode';
import DashboardHeader from './DashboardHeader';

export default function dashboardPage() {
  // This would likely come from props or state in a real app
  const balance = 0.0;
  const stats = [
    {
      icon: <ChainIcon />,
      label: 'Total Referrals',
      value: 27,
      valueColor: 'text-[#0072BB]',
    },
    {
      icon: <TagIcon />,
      label: 'Sales',
      value: '$1,267',
      valueColor: 'text-[#0072BB]',
    },
    {
      icon: <DollarIcon />,
      label: 'Payouts Due',
      value: '$500',
      valueColor: 'text-[#0072BB]',
    },
  ];

  return (
    <>
      <div className="bg-[#f9f9f9]">
        <DashboardHeader balance={balance} />
        <div className="mx-auto flex flex-col gap-[16px] px-[16px] py-[24px] md:max-w-7xl md:px-0">
          <div className="rounded-[10px] bg-white">
            <div className="text-[16px] font-medium text-[#8E8E93] capitalize">
              performance metrics
            </div>
          </div>
          <div className="rounded-[10px] bg-white">
            <ReferralCode code="CREATOR2024" />
          </div>

          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-[10px] bg-white px-[16px] py-[20px]"
            >
              <div className="flex items-center gap-x-[16px]">
                <div className="rounded-full bg-[#121212] p-[10px]">
                  {stat.icon}
                </div>
                <div className="font-medium">{stat.label}</div>
              </div>
              <div className={`font-medium ${stat.valueColor}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
