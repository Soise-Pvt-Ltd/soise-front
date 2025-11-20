import SwiperCarousel from "../caurosel";

export default function BeforeExploreCollection() {
  const items  = ([
    { title: "Nike Air Max", price: Math.random() * 200, tag: "Hot" },
    { title: "Adidas Runner", price: Math.random() * 200 },
    { title: "Puma X90", price: Math.random() * 200, tag: "New" },
    { title: "Jordan 4 Retro", price: Math.random() * 200 },
  ]);

  const images = [
    "/before-explore-collection-1.png",
    "/before-explore-collection-2.png",
    "/before-explore-collection-3.png",
  ];
  return (
    <>
     <div className="my-[34px] md:my-[68px] xl:my-[98px] px-[16px] md:px-[32px] xl:px-[64px]">
          <SwiperCarousel items={items} />
        </div>
      <div className="bg-[#F5F5F5] py-23 mt-[35px]">
        <div className="flex items-center space-x-[98px]">
          {images.map((src, index) => (
            <div
              key={index}
              className="w-[170px] md:w-full h-[464px] mb-[24px]"
            >
              <img
                src={src}
                alt={`Before Explore ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
