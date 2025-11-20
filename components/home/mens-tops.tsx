import { ArrowRightIcon } from "../icons";

export default function MensTops() {
  return (
    <div className="flex flex-col justify-between h-[464px] w-full bg-[url('/mens-top.jpg')] bg-cover bg-center flex flex-col justify-between p-[24px] md:p-[48px]">
      <div></div>
      <div className="flex items-center justify-between">
        <div></div>
        <div>
          <p className="text-white text-[24px] font-semibold">Men's Tops</p>
          <a
            href="#"
            className="text-white text-right flex items-center justify-end gap-2"
          >
            <span className="text-[14px] underline hover:no-underline hover:cursor-pointer">
              Explore Collection
            </span>
            <ArrowRightIcon />
          </a>
        </div>
      </div>
    </div>
  );
}
