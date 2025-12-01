import { MenuIcon, NotificationIcon, WalletIcon } from '@/components/icons';

interface DashboardHeaderProps {
  balance: number;
}

export default function DashboardHeader({ balance }: DashboardHeaderProps) {
  return (
    <div className="bg-white">
      <div className="mx-auto flex items-center justify-between px-[16px] pt-[52px] pb-[16px] md:max-w-7xl md:px-0">
        <div className="size-[40px] rounded-full bg-[#f9f9f9]"></div>

        <div className="flex items-center gap-x-[24px]">
          <div className="flex items-center gap-x-[16px] rounded-[12px] bg-[#f9f9f9] p-[15px]">
            <div
              className={`font-medium ${balance > 0 ? 'text-[#22C55E]' : 'text-[#FF8073]'}`}
            >
              ${balance.toFixed(2)}
            </div>
            <WalletIcon />
          </div>
          <MenuIcon />
          <NotificationIcon />
        </div>
      </div>
    </div>
  );
}
