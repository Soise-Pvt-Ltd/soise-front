import SwiperCarousel from '../caurosel';

export default function BeforeExploreCollection() {
  const items = [
    { title: 'Nike Air Max', price: Math.random() * 200, tag: 'Hot' },
    { title: 'Adidas Runner', price: Math.random() * 200 },
    { title: 'Puma X90', price: Math.random() * 200, tag: 'New' },
    { title: 'Jordan 4 Retro', price: Math.random() * 200 },
  ];

  const images = [
    '/before-explore-collection-1.png',
    '/before-explore-collection-2.png',
    '/before-explore-collection-3.png',
  ];
  return (
    <>
      <div className="my-[34px] px-[16px] md:my-[68px] md:px-[32px] xl:my-[98px] xl:px-[64px]">
        <SwiperCarousel items={items} />
      </div>
      <div className="mt-[35px] bg-[#F5F5F5] px-[16px] py-23 md:px-[32px] xl:px-[64px]">
        <div className="flex items-center space-x-[48px] md:space-x-[98px]">
          {images.map((src, index) => (
            <div
              key={index}
              className="mb-[24px] h-[280px] w-[170px] md:h-[464px] md:w-full"
            >
              <img
                src={src}
                alt={`Before Explore ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
