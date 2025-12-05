import GridContainer from '../gridContainer';
import { AdminSoundLevelsIcon } from '@/components/icons';

export default function CreatorsPage() {
  return (
    <GridContainer>
      <div className="px-[16px]">
        <div className="py-[22px]">
          <span className="text-[20px] font-medium">Creators</span>
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
        <div className="rounded-b-[20px] bg-white px-[24px] py-[30px] md:h-screen"></div>
      </div>
    </GridContainer>
  );
}
