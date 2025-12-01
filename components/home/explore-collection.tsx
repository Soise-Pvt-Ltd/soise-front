import Image from 'next/image';
import Link from 'next/link';

export default function ExploreCollection() {
  return (
    <div className="flex h-[464px] w-full flex-col justify-between bg-[#040000] p-[24px] md:p-[48px]">
      <div className="flex flex-grow items-center justify-center">
        <Image
          src="/explore_collection.png"
          alt="Explore Collection"
          width={211}
          height={113}
        />
      </div>

      <Link
        href="/product-listing"
        className="text-right text-[14px] text-white uppercase underline hover:cursor-pointer hover:no-underline"
      >
        EXPLORE COLLECTION
      </Link>
    </div>
  );
}
