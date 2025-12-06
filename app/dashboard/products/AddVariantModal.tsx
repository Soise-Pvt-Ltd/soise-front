'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { AdminUploadIcon } from '@/components/icons';

interface MyFile extends File {
  preview: string;
}

interface Variant {
  images: MyFile[];
  sizes: string[];
  colors: string[];
  price: number;
  stock: number;
}

interface AddVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (variant: Variant) => void;
}

const SIZES = ['s', 'm', 'xl', 'xxl'];

export default function AddVariantModal({
  isOpen,
  onClose,
  onSave,
}: AddVariantModalProps) {
  // State for variant form fields
  const [files, setFiles] = useState<MyFile[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);

  // Dropzone for images
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
          onLoad={() => URL.revokeObjectURL(file.preview)}
        />
      </div>
    </div>
  ));

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  // Handlers for form inputs
  const handleSizeClick = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  const handleColorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newColor = colorInput.trim();
      if (newColor && !colors.includes(newColor)) {
        setColors([...colors, newColor]);
        setColorInput('');
      }
    }
  };

  const removeColor = (colorToRemove: string) => {
    setColors(colors.filter((color) => color !== colorToRemove));
  };

  const handleSaveVariant = () => {
    const newVariant: Variant = {
      images: files,
      sizes: selectedSizes,
      colors,
      price,
      stock,
    };
    onSave(newVariant);
    onClose(); // Close modal after saving
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center bg-black"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex h-full w-full max-w-4xl flex-col rounded-2xl bg-white px-8 pt-6 pb-8 shadow-xl md:max-h-[90vh]">
        <div className="pb-0">
          <div className="">
            <h2 id="modal-title" className="text-[20px] font-medium capitalize">
              Add product variants
            </h2>
          </div>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {/* Horizontal Line */}
        <div className="mx-[-2rem] my-6 border-t border-gray-200"></div>

        <div id="modal_body" className="scrollbar-hide flex-1 overflow-y-auto">
          <div className="mb-[24px]">
            <div className="mb-[16px] text-[15px] font-medium">
              Product detail
            </div>
            <div className="space-y-[16px] text-[13px]">
              <div className="font-medium">Street hoodie</div>
              <div>
                <ul className="flex items-center space-x-[8px] text-[13px] text-[#8E8E93]">
                  <li>• Body 100% cotton.</li>
                  <li>• Metal zip front closure.</li>
                  <li>• Body 100% cotton.</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mb-4 flex items-center justify-between text-[15px] font-medium">
            <div>Variant</div>
            <div>+ Add Variant</div>
          </div>
          <div className="rounded-[10px] border border-[#AEAEB266]/40 p-[30px]">
            <div className="gid-cols-1 grid gap-[16px] md:grid-cols-2">
              <div>
                <div {...getRootProps({ className: 'dropzone h-full' })}>
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
              <div className="space-y-[16px] py-[10px]">
                <div>
                  <label className="adminsolidlabel">Available sizes</label>
                  <div className="mt-[8px] flex items-center gap-x-[24px]">
                    {SIZES.map((size) => (
                      <div
                        onClick={() => handleSizeClick(size)}
                        key={size}
                        className={`flex h-[40px] w-[54px] cursor-pointer items-center justify-center rounded-[2px] border text-[11px] uppercase transition-colors ${selectedSizes.includes(size) ? 'border-3 border-[#0072BB] bg-[#F5F5F5]' : 'border-[#8E8E93] bg-[#F5F5F5]'}`}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="adminsolidlabel">Color</label>
                  <div className="flex !h-auto flex-wrap items-center gap-2">
                    {colors.map((color) => (
                      <div
                        key={color}
                        className="flex items-center gap-2 rounded-full bg-gray-200 py-1 pr-3 pl-2 text-sm"
                      >
                        <div
                          className="h-4 w-4 rounded-full border border-gray-300"
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
                      placeholder="Add colors..."
                    />
                  </div>
                </div>
                <div>
                  <label className="adminsolidlabel">Product price</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="adminsolid"
                  />
                </div>
                <div>
                  <label className="adminsolidlabel">Available stock</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="adminsolid"
                  />
                </div>
                <button
                  onClick={handleSaveVariant}
                  className="btn_creators_solid"
                >
                  Save Variant
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
