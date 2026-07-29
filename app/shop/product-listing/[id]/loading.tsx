import { Bone, LoadingAnnounce } from '@/components/skeleton';

// The product page is the slowest route and the one most often tapped from an
// ad, so it is the one that most needs to show its shape immediately.
export default function Loading() {
  return (
    <div className="page-shell px-[16px] py-[40px]">
      <LoadingAnnounce label="Loading product" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          <Bone className="aspect-[4/5] w-full" />
        </div>
        <div className="flex flex-col gap-y-[14px] md:col-span-2">
          <Bone className="h-[26px] w-4/5" />
          <Bone className="h-[20px] w-1/3" />
          <Bone className="mt-[10px] h-[12px] w-full" />
          <Bone className="h-[12px] w-11/12" />
          <Bone className="h-[12px] w-2/3" />
          <div className="mt-[18px] flex gap-x-[10px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="h-[38px] w-[38px] rounded-full" />
            ))}
          </div>
          <Bone className="mt-[22px] h-[53px] w-full rounded-[10px]" />
          <Bone className="h-[53px] w-full rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}
