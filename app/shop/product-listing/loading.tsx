import { Bone, ProductCardSkeleton, LoadingAnnounce } from '@/components/skeleton';

// Mirrors ProductListingClient's grid so the real cards land in the same
// positions the skeleton occupied — no shift, no re-read.
export default function Loading() {
  return (
    <div className="page-shell px-[16px] py-[40px]">
      <LoadingAnnounce label="Loading collection" />
      <Bone className="mb-[8px] h-[28px] w-[220px]" />
      <Bone className="mb-[36px] h-[14px] w-[140px]" />
      <div className="grid grid-cols-2 gap-x-[10px] gap-y-[24px] md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 4xl:grid-cols-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
