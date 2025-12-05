import GridContainer from '../gridContainer';
import {
  AdminSoundLevelsIcon,
  AdminMoreHorizontalIcon,
} from '@/components/icons';

export default function PayoutPage() {
  return (
    <GridContainer>
      <div className="px-[16px]">
        <div className="py-[22px]">
          <span className="text-[20px] font-medium">Payout</span>
        </div>
      </div>

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

      <div className="mt-[24px]">
        <div className="rounded-t-[20px] border-b border-[#AEAEB266]/40 bg-white px-[24px] py-[24px] text-[#121212]">
          <div className="flex flex-col flex-row items-center justify-between">
            <div>
              {' '}
              <input
                type="text"
                placeholder="Search users..."
                className="rounded-[10px] border-0 bg-[#F5F5F5] text-[12px] focus:ring-0 md:w-[245px]"
              />
            </div>
            <div className="flex items-center gap-x-[16px]">
              <button className="btn_admin_outline flex items-center gap-x-[2px]">
                <AdminSoundLevelsIcon /> Latest
              </button>
            </div>
          </div>
        </div>
        <div className="h-screen rounded-b-[20px] bg-white px-[24px] py-[30px]"></div>
      </div>
    </GridContainer>
  );
}
