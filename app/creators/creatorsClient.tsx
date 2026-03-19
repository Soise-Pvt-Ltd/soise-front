'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftIcon, MenuIcon, CircleCheckIcon } from '@/components/icons';
import Image from 'next/image';
import Menu from './dashboard/Menu';
import { submitCreatorApplication } from './actions';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { showToast } from '@/lib/toast-utils';

export default function CreatorsApplicationClient() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [formData, setFormData] = useState({
    portfolioUrl: '',
    bio: '',
    niche: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.portfolioUrl || !formData.bio || !formData.niche) {
      showToast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const payload = new FormData();
    payload.append('portfolioUrl', formData.portfolioUrl);
    payload.append('bio', formData.bio);
    payload.append('niche', formData.niche);

    const result = await submitCreatorApplication(payload);
    setIsLoading(false);
    if (result?.success) {
      setSubmissionSuccess(true);
    } else {
      showToast.error(result?.error || 'An error occurred during submission. Please try again.');
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="profile mx-auto mb-[119px] px-[16px] md:max-w-7xl">
        <div className="xs:gap-y-0 flex flex-wrap items-center justify-between gap-y-4 pt-[51px] pb-[28px]">
          <div>{/* <ArrowLeftIcon /> */}</div>
          <Image src="/logo.png" alt="Soise Logo" width={100} height={58} />
          <div
            onClick={() => setIsMenuOpen(true)}
            className="hover:cursor-pointer"
          >
            <MenuIcon />
          </div>
        </div>
        {submissionSuccess ? (
          <div className="mt-[112px] flex flex-col items-center justify-center">
            <div className="flex w-[208px] flex-col items-center text-center">
              <CircleCheckIcon />
              <div className="mt-[20px] gap-y-[16px]">
                <p className="text-[16px] font-semibold">
                  Submission successful
                </p>
                <p className="text-[14px] text-[#8E8E93]">
                  Your creator application has been successfully submitted. We
                  will get back to you shortly.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="btn_black mt-[40px] sm:!w-fit sm:!px-[40px]"
            >
              Go Home
            </button>
          </div>
        ) : (
          <div className="mt-[24px]">
            <h1 className="text-[16px] uppercase">Creators Application</h1>
            <div className="mt-[24px] mb-[18px] space-y-[16px]">
              <div>
                <label>Portfolio URL</label>
                <input
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  type="text"
                  className="solid"
                  placeholder="link"
                />
              </div>

              <div>
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="solid min-h-[96px] resize-none"
                  placeholder="type a short description about yourself"
                />
              </div>
              <div>
                <label>Niche</label>
                <input
                  name="niche"
                  value={formData.niche}
                  onChange={handleChange}
                  type="text"
                  className="solid"
                  placeholder="what's your niche"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading || !formData.portfolioUrl || !formData.bio || !formData.niche}
              className="btn_black mt-[40px] disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        )}
      </div>
      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        showMenuItems={false}
      />
    </>
  );
}
