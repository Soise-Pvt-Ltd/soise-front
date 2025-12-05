'use client';

import { useState, useEffect } from 'react';
import GridContainer from '../gridContainer';
import { ArrowLeftIcon } from '@/components/icons';
import { useDropzone } from 'react-dropzone';
import {
  AdminUploadIcon,
  AdminSoundLevelsIcon,
  AdminPlusCircleIcon,
} from '@/components/icons';

import AddVariantModal from './AddVariantModal';
interface MyFile extends File {
  preview: string;
}

export default function ProductsPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

  const periodOptions = ['Today', 'Weekly', 'Monthly'];
  const [activeTab, setActiveTab] = useState<
    'all' | 'active' | 'draft' | 'archived'
  >('all');
  const [showAddProduct, setShowAddProduct] = useState(false);

  const [isLive, setIsLive] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [variants, setVariants] = useState([]); // To store saved variants
  const [files, setFiles] = useState<MyFile[]>([]);
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 3,
    onDrop: (acceptedFiles) => {
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          }),
        ),
      );
    },
  });

  const thumbs = files.map((file) => (
    <div
      key={file.name}
      className="inline-flex h-24 w-24 rounded border border-gray-300 p-1"
    >
      <div className="flex min-w-0 overflow-hidden">
        <img
          src={file.preview}
          className="block h-full w-full object-cover"
          onLoad={() => {
            URL.revokeObjectURL(file.preview);
          }}
        />
      </div>
    </div>
  ));

  useEffect(() => {
    // Make sure to revoke the data uris to avoid memory leaks, will run on unmount
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]); // Changed to an array
  const SIZES = ['s', 'm', 'xl', 'xxl'];

  const handleSizeClick = (size: string) => {
    setSelectedSizes((prevSelectedSizes) => {
      if (prevSelectedSizes.includes(size)) {
        // If already selected, remove it
        return prevSelectedSizes.filter((s) => s !== size);
      } else {
        // If not selected, add it
        return [...prevSelectedSizes, size];
      }
    });
  };

  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newKeyword = keywordInput.trim();
      if (newKeyword && !keywords.includes(newKeyword)) {
        setKeywords([...keywords, newKeyword]);
        setKeywordInput('');
      }
    } else if (
      e.key === 'Backspace' &&
      keywordInput === '' &&
      keywords.length > 0
    ) {
      setKeywords(keywords.slice(0, -1));
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((keyword) => keyword !== keywordToRemove));
  };

  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');

  const handleColorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newColor = colorInput.trim();
      if (newColor && !colors.includes(newColor)) {
        setColors([...colors, newColor]);
        setColorInput('');
      }
    } else if (
      e.key === 'Backspace' &&
      colorInput === '' &&
      colors.length > 0
    ) {
      setColors(colors.slice(0, -1));
    }
  };

  const removeColor = (colorToRemove: string) => {
    setColors(colors.filter((color) => color !== colorToRemove));
  };

  const handleSaveVariant = (newVariant: any) => {
    // // Here you would typically update your main form state with the new variant
    // console.log('New Variant Saved:', newVariant);
    // setVariants((prev) => [...prev, newVariant]);
  };

  return (
    <GridContainer>
      <>
        <div className="px-[16px]">
          {showAddProduct ? (
            <div className="flex items-center justify-between py-[22px]">
              <div
                className="hover: flex cursor-pointer items-center gap-x-2 hover:underline"
                onClick={() => setShowAddProduct(false)}
              >
                <ArrowLeftIcon />{' '}
                <span className="font-medium">Add product</span>
              </div>
              <button
                onClick={() => setIsVariantModalOpen(true)}
                className="cursor-pointer hover:underline"
              >
                + Add Variant
              </button>
            </div>
          ) : (
            <div className="py-[22px]">
              <span className="text-[20px] font-medium">Products</span>
            </div>
          )}
        </div>

        {!showAddProduct && (
          <div className="">
            <div className="relative rounded-t-[20px] border-b border-[#AEAEB266]/40 bg-white px-[24px] pt-[24px] text-[#121212]">
              <div className="scrollbar-hide flex flex-col-reverse items-start justify-between gap-4 overflow-visible sm:flex-row sm:items-center">
                <div className="flex items-center gap-8">
                  {[
                    {
                      id: 'all',
                      label: 'All',
                    },
                    {
                      id: 'active',
                      label: 'Active',
                    },
                    { id: 'draft', label: 'Draft' },
                    {
                      id: 'archived',
                      label: 'Archived',
                    },
                  ].map(({ id, label }: any) => {
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`relative cursor-pointer pb-4 text-[14px] transition-all duration-200 ease-in-out ${
                          isActive
                            ? 'text-gray-900'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {label}
                        {isActive && (
                          <span className="absolute top-full left-0 z-10 h-[2px] w-full translate-y-[-2px] rounded-t-sm bg-gray-900 sm:translate-y-[4px]" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-x-[16px] pb-4">
                  <div className="relative flex items-center">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="btn_admin_outline flex items-center gap-x-[2px]"
                    >
                      <AdminSoundLevelsIcon />
                      {selectedPeriod}
                    </button>
                    {isDropdownOpen && (
                      <div className="ring-opacity-6 absolute top-full right-0 z-30 mt-2 w-32 origin-top-right rounded-md bg-white ring-1 ring-gray-200">
                        <div className="py-1">
                          {periodOptions.map((option) => (
                            <button
                              key={option}
                              onClick={() => {
                                setSelectedPeriod(option);
                                setIsDropdownOpen(false);
                              }}
                              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#AFB1B0] hover:bg-gray-100 hover:text-gray-400"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="btn_admin_outline flex items-center gap-x-[2px]"
                  >
                    <AdminPlusCircleIcon />
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div
              id="product_display"
              className="z-10 rounded-b-[20px] bg-white px-[24px] py-[30px] md:h-screen"
            >
              {activeTab === 'all' && (
                <div>Displaying All products section.</div>
              )}
              {activeTab === 'active' && (
                <div>Displaying Active products section.</div>
              )}
              {activeTab === 'draft' && (
                <div>Displaying Draft products section.</div>
              )}
              {activeTab === 'archived' && (
                <div>Displaying Archived products section.</div>
              )}
            </div>
          </div>
        )}

        {showAddProduct && (
          <div id="add_product">
            {/* 1st layer */}
            <div>
              <div className="grid grid-cols-1 space-y-[24px] gap-x-[16px] md:grid-cols-7 lg:space-y-0">
                <div className="flex flex-col rounded-[20px] bg-white px-[24px] py-[30px] text-[#121212] md:col-span-3">
                  <div className="pb-[20px] capitalize">product Media</div>
                  <div className="adminsolidlabel">Photo</div>

                  <div
                    {...getRootProps({
                      className: 'dropzone h-full',
                    })}
                  >
                    <div className="mt-[8px] flex h-full cursor-pointer flex-col items-center justify-center rounded-lg border-1 border-dashed border-[#DADDDC] bg-gray-50 p-6 text-center">
                      <input {...getInputProps()} />

                      {files.length > 0 && (
                        <div className="mb-4 flex flex-wrap justify-center gap-2">
                          {thumbs}
                        </div>
                      )}
                      <button
                        type="button"
                        className="flex items-center justify-center gap-x-[2.5px] rounded-[10px] border-2 border-[#0072BB] bg-[#B3D5EB33] p-[10px] text-sm font-semibold text-[#0072BB]"
                      >
                        <AdminUploadIcon /> Upload Image
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] bg-white px-[24px] py-[30px] text-[#121212] md:col-span-4">
                  <div>
                    <div className="flex justify-between pb-[24px]">
                      <div className="capitalize">product information</div>
                      <label
                        htmlFor="live-toggle"
                        className="relative inline-flex cursor-pointer items-center gap-x-2"
                      >
                        <span className="text-[14px] text-[#121212]">Live</span>

                        <input
                          type="checkbox"
                          id="live-toggle"
                          checked={isLive}
                          onChange={(e) => setIsLive(e.target.checked)}
                          className="peer sr-only"
                        />

                        <div className="relative h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-[#32AC5B] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:after:translate-x-5"></div>
                      </label>
                    </div>
                    <div className="space-y-[24px]">
                      <div>
                        <label className="adminsolidlabel">Product name</label>
                        <input type="text" className="adminsolid" />
                      </div>
                      <div>
                        <label className="adminsolidlabel">
                          Product description
                        </label>
                        <textarea className="adminsolid !h-[162px]"></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2nd layer */}
            <div>
              <div className="my-[24px] grid grid-cols-1 space-y-[24px] gap-x-[16px] md:grid-cols-7 lg:space-y-0">
                <div className="flex flex-col justify-between rounded-[20px] bg-white px-[24px] py-[30px] text-[#121212] md:col-span-3">
                  <div className="pb-[24px]">Category</div>
                  <div className="space-y-[24px]">
                    <div>
                      <label className="adminsolidlabel">
                        Product description
                      </label>
                      <select className="adminsolid">
                        <option>Category 1</option>
                        <option>Category 2</option>
                        <option>Category 3</option>
                      </select>
                    </div>
                    <div>
                      <div className="adminsolidlabel">Key Search Words</div>

                      <div
                        className={`flex !h-auto flex-wrap items-center gap-2 ${
                          keywords.length > 0 ? 'mt-[8px]' : ''
                        }`}
                      >
                        {keywords.map((keyword) => (
                          <div
                            key={keyword}
                            className="flex items-center gap-1 rounded bg-gray-200 px-2 py-1 text-sm"
                          >
                            {keyword}
                            <button
                              onClick={() => removeKeyword(keyword)}
                              className="text-gray-500 hover:text-gray-800"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        <input
                          type="text"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={handleKeywordKeyDown}
                          className="adminsolid flex-grow !border-none bg-transparent text-[14px] !outline-none focus:ring-0 focus:outline-none"
                          placeholder="Add keywords..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-[20px] bg-white px-[24px] py-[30px] text-[#121212] md:col-span-4">
                  <div className="pb-[24px]">Pricing</div>

                  <div className="space-y-[24px]">
                    <div>
                      <label className="adminsolidlabel">Product price</label>
                      <input type="number" className="adminsolid" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 md:space-x-[10px]">
                      <div>
                        <label className="adminsolidlabel">
                          Discount percentage
                        </label>
                        <input type="text" className="adminsolid" />
                      </div>
                      <div>
                        <label className="adminsolidlabel">Discount type</label>
                        <select className="adminsolid">
                          <option disabled>Select discount type</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3rd layer */}
            <div>
              <div className="grid grid-cols-1 space-y-[24px] gap-x-[16px] md:grid-cols-7 lg:space-y-0">
                <div className="rounded-[20px] bg-white px-[24px] py-[30px] text-[#121212] md:col-span-3">
                  <div className="pb-[24px] capitalize">Available sizes</div>
                  <div className="flex items-center gap-x-[24px]">
                    {SIZES.map((size, index) => (
                      <div
                        onClick={() => handleSizeClick(size)} // Updated onClick handler
                        key={index}
                        className={`flex h-[40px] w-[54px] cursor-pointer items-center justify-center rounded-[2px] border text-[11px] uppercase transition-colors ${
                          selectedSizes.includes(size) // Check if size is in the array
                            ? 'border-3 border-[#0072BB] bg-[#F5F5F5]'
                            : 'border-[#8E8E93] bg-[#F5F5F5]'
                        }`}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] bg-white px-[24px] py-[30px] text-[#121212] md:col-span-4">
                  <div className="pb-[24px] capitalize">Color</div>
                  <div className="flex !h-auto flex-wrap items-center gap-2">
                    {colors.map((color) => (
                      <div
                        key={color}
                        className="flex items-center gap-2 rounded-full bg-gray-200 py-1 pr-3 pl-2 text-sm"
                      >
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: color }}
                        ></div>

                        <span className="capitalize">{color}</span>

                        <button
                          onClick={() => removeColor(color)}
                          className="text-gray-500 hover:text-gray-800"
                          aria-label={`Remove ${color}`}
                          title={`Remove ${color}`}
                        >
                          &times;
                        </button>
                      </div>
                    ))}

                    <input
                      type="text"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      onKeyDown={handleColorKeyDown}
                      className="adminsolid !mt-0 flex-grow text-[14px]"
                      placeholder="Add colors (e.g., red, #FF5733)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <AddVariantModal
              isOpen={isVariantModalOpen}
              onClose={() => setIsVariantModalOpen(false)}
              onSave={handleSaveVariant}
            />
          </div>
        )}
      </>
    </GridContainer>
  );
}
