import Image from "next/image";

export default function ExploreCollection() {
  return (
    <div className="flex flex-col justify-between p-[24px] md:p-[48px] bg-[#040000] h-[464px] w-full">
      <div className="flex items-center justify-center flex-grow">
        <Image
          src="/explore_collection.png"
          alt="Explore Collection"
          width={211}
          height={113}
        />
      </div>

      <a
        href="#"
        className="uppercase text-[14px] text-white underline hover:no-underline hover:cursor-pointer text-right"
      >
        EXPLORE COLLECTION
      </a>
    </div>
  );
}
