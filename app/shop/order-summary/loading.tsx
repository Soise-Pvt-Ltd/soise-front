import { Bone, LoadingAnnounce } from '@/components/skeleton';

// Checkout. Every second of blank screen here is a second someone spends
// reconsidering, so it shows the bag and form shape straight away.
export default function Loading() {
  return (
    <div className="page-shell px-[20px] py-[40px]">
      <LoadingAnnounce label="Loading your bag" />
      <Bone className="mb-[24px] h-[14px] w-[130px]" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="mb-[24px] flex gap-x-[16px]">
          <Bone className="h-[120px] w-[120px]" />
          <div className="flex flex-1 flex-col gap-y-[8px] py-[4px]">
            <Bone className="h-[14px] w-2/3" />
            <Bone className="h-[12px] w-1/3" />
            <Bone className="mt-auto h-[36px] w-[96px] rounded-[4px]" />
          </div>
        </div>
      ))}
      <Bone className="mt-[30px] mb-[10px] h-[12px] w-full" />
      <Bone className="h-[12px] w-1/2" />
      <Bone className="mt-[28px] h-[53px] w-full rounded-[10px]" />
    </div>
  );
}
