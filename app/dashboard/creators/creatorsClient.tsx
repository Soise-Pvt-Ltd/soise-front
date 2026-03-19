'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import GridContainer from '../gridContainer';
import {
  AdminSoundLevelsIcon,
  AdminMoreVerticalIcon,
  AdminBadge1,
  AdminBadge2,
  AdminBadge3,
  AdminPlusCircleIcon,
  CloseIconTags,
} from '@/components/icons';
import { fetchTiers, createTier, updateTier, assignTierToCreator } from './actions';
import { showToast } from '../toast';

type Creator = {
  id: string;
  creator_code_id?: string;
  full_name: string;
  avatar: string;
  tier: {
    name: string;
    level: number;
  };
  email: string;
  sales_generated: number;
  created_at: string;
};

interface CreatorsPageProps {
  initialData: Creator[];
  initialMeta: any;
  fetchServerData: (
    limit?: number,
    offset?: number,
    search?: string,
    period?: string,
  ) => Promise<any>;
}

export default function CreatorsClient({
  initialData,
  initialMeta,
  fetchServerData,
}: CreatorsPageProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(
    null,
  );
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [creators, setCreators] = useState<Creator[]>(initialData || []);
  const [pagination, setPagination] = useState(
    initialMeta?.pagination || { limit: 50, offset: 0, count: 0 },
  );
  const [isLoading, setIsLoading] = useState(false);
  const isFirstRender = useRef(true);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const [showTierModal, setShowTierModal] = useState(false);
  const [tierView, setTierView] = useState<'list' | 'create' | 'edit'>('list');
  const [tiers, setTiers] = useState<any[]>([]);
  const [tierName, setTierName] = useState('');
  const [tierLevel, setTierLevel] = useState('');
  const [tierDescription, setTierDescription] = useState('');
  const [tierBaseRate, setTierBaseRate] = useState('');
  const [tierMaxRate, setTierMaxRate] = useState('');
  const [editingTierId, setEditingTierId] = useState<string | null>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningCreator, setAssigningCreator] = useState<Creator | null>(null);
  const [selectedTierIdForAssign, setSelectedTierIdForAssign] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const periodOptions = [
    'All Time',
    'Last 7 Days',
    'Last 30 Days',
    'Last 90 Days',
  ];

  const closeTierModal = useCallback(() => {
    setShowTierModal(false);
    setTierView('list');
    setTierName('');
    setTierLevel('');
    setTierDescription('');
    setTierBaseRate('');
    setTierMaxRate('');
  }, []);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
      setActiveActionMenuId(null);
    }
    if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
      setIsDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (!showTierModal) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTierModal();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showTierModal, closeTierModal]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      handleFilterChange();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, selectedPeriod]);

  const handleFilterChange = async () => {
    setIsLoading(true);
    const result = await fetchServerData(
      pagination.limit,
      0,
      searchValue,
      selectedPeriod,
    );
    if (result.success) {
      setCreators(result.data);
      setPagination({ ...result.meta.pagination, offset: 0 });
    }
    setIsLoading(false);
  };

  const handlePageChange = async (newOffset: number) => {
    if (newOffset < 0 || newOffset >= pagination.count) return;
    setIsLoading(true);
    const result = await fetchServerData(
      pagination.limit,
      newOffset,
      searchValue,
      selectedPeriod,
    );
    if (result.success) {
      setCreators(result.data);
      setPagination(result.meta.pagination);
    }
    setIsLoading(false);
  };

  const loadTiers = async () => {
    const result = await fetchTiers();
    if (result.success) {
      setTiers(result.data);
    }
  };

  useEffect(() => {
    if (showTierModal) {
      loadTiers();
    }
  }, [showTierModal]);

  const handleCreateTier = async () => {
    if (!tierName.trim() || !tierLevel) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', tierName);
      formData.append('level', tierLevel);
      formData.append('description', tierDescription);
      formData.append('base_rate', tierBaseRate || '10');
      formData.append('max_rate', tierMaxRate || '20');
      const result = await createTier(formData);

      if (result.success) {
        showToast('success', 'Tier created successfully');
        closeTierModal();
        handleFilterChange();
      } else {
        showToast('error', `Failed to create tier: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      showToast('error', 'Failed to create tier');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTier = async () => {
    if (!tierName.trim() || !tierLevel || !editingTierId) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', editingTierId);
      formData.append('name', tierName);
      formData.append('level', tierLevel);
      if (tierDescription) formData.append('description', tierDescription);
      if (tierBaseRate) formData.append('base_rate', tierBaseRate);
      if (tierMaxRate) formData.append('max_rate', tierMaxRate);
      const result = await updateTier(formData);

      if (result.success) {
        showToast('success', 'Tier updated successfully');
        closeTierModal();
        handleFilterChange();
      } else {
        showToast('error', `Failed to update tier: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      showToast('error', 'Failed to update tier');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTier = async () => {
    if (!assigningCreator?.creator_code_id || !selectedTierIdForAssign) return;
    setIsAssigning(true);
    try {
      const result = await assignTierToCreator(
        assigningCreator.creator_code_id,
        selectedTierIdForAssign,
      );
      if (result.success) {
        showToast('success', 'Tier assigned successfully');
        setShowAssignModal(false);
        setAssigningCreator(null);
        setSelectedTierIdForAssign('');
        handleFilterChange();
      } else {
        showToast('error', result.error || 'Failed to assign tier');
      }
    } catch {
      showToast('error', 'Failed to assign tier');
    } finally {
      setIsAssigning(false);
    }
  };

  const renderContent = () => (
    <div className="overflow-x-auto">
      {isLoading && (
        <div className="py-4 text-center text-sm text-gray-500">Loading...</div>
      )}
      <table className="min-w-full text-left text-[13px]">
        <thead>
          <tr>
            <th scope="col" className="thead truncate">
              Creator
            </th>
            <th scope="col" className="thead">
              Tier
            </th>
            <th scope="col" className="thead">
              Email
            </th>
            <th scope="col" className="thead whitespace-nowrap">
              Sales Generated
            </th>
            <th scope="col" className="thead">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {creators.map((creatorItem: Creator, index: number, arr: any) => {
            const creator = {
              ...creatorItem,
              tier: creatorItem.tier || { name: 'Tier 1', level: 1 },
            };
            return (
              <tr key={creator.id}>
                <td className="td">
                  <div className="flex items-center gap-x-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(creator.full_name || '?')}`}
                      alt={creator.full_name || 'Creator'}
                      className="size-8 rounded-full object-cover"
                    />
                    <div className="truncate">{creator.full_name}</div>
                  </div>
                </td>
                <td className="td">
                  <div className="flex items-center gap-x-1.5">
                    <span
                      style={{
                        color: creator.tier?.name
                          .toLowerCase()
                          .includes('tier 1')
                          ? '#CD7F32'
                          : creator.tier?.name.toLowerCase().includes('tier 2')
                            ? '#C0C0C0'
                            : creator.tier?.name
                                  .toLowerCase()
                                  .includes('tier 3')
                              ? '#FFD700'
                              : '#8E8E93',
                      }}
                      className="capitalize"
                    >
                      {creator.tier.name}
                    </span>
                    {creator.tier?.name.toLowerCase().includes('tier 1') && (
                      <AdminBadge1 />
                    )}
                    {creator.tier?.name.toLowerCase().includes('tier 2') && (
                      <AdminBadge2 />
                    )}
                    {creator.tier?.name.toLowerCase().includes('tier 3') && (
                      <AdminBadge3 />
                    )}
                  </div>
                </td>
                <td className="td">{creator.email}</td>
                <td className="td">₦{creator.sales_generated}</td>
                <td className="td">
                  <div ref={activeActionMenuId === creator.id ? actionMenuRef : undefined} className="relative">
                    <button
                      onClick={() =>
                        setActiveActionMenuId(
                          activeActionMenuId === creator.id ? null : creator.id,
                        )
                      }
                      className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] bg-[#F5F5F5] outline-none transition-colors duration-150 hover:bg-[#EBEBEB] focus-visible:ring-2 focus-visible:ring-[#0072BB]"
                      aria-label={`Actions for ${creator.full_name}`}
                      aria-expanded={activeActionMenuId === creator.id}
                    >
                      <AdminMoreVerticalIcon />
                    </button>
                    {activeActionMenuId === creator.id && (
                      <div
                        className={`ring-opacity-5 absolute right-0 z-50 w-32 origin-top-right rounded-md bg-white text-sm shadow-md ring-1 ring-[#F5F5F5] focus:outline-none ${
                          index === arr.length - 1 ? 'bottom-full mb-2' : 'mt-2'
                        }`}
                      >
                        <div className="py-1">
                          <button
                            className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                              setAssigningCreator(creator);
                              setSelectedTierIdForAssign('');
                              loadTiers();
                              setShowAssignModal(true);
                              setActiveActionMenuId(null);
                            }}
                          >
                            Update tier
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <GridContainer>
      <div className="px-[16px]">
        <div className="py-[22px]">
          <span className="text-[20px] font-medium">Creators</span>
        </div>
      </div>

      <div className="">
        <div className="rounded-t-[20px] border-b border-[#AEAEB266]/40 bg-white px-[24px] py-[24px] text-[#121212]">
          <div className="flex flex-row items-center justify-between gap-x-2">
            <input
              type="text"
              placeholder="Search creators..."
              aria-label="Search creators"
              className="h-[36px] w-full rounded-[10px] border-0 bg-[#F5F5F5] text-[12px] outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#0072BB] md:w-[245px]"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />

            <div className="flex items-center gap-x-2">
              <div ref={filterDropdownRef} className="relative flex items-center">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="btn_admin_outline flex items-center gap-x-[2px]"
                  aria-label="Filter by time period"
                  aria-expanded={isDropdownOpen}
                >
                  <AdminSoundLevelsIcon />
                  <span className="hidden whitespace-nowrap md:inline-block">
                    {selectedPeriod}
                  </span>
                </button>
                {isDropdownOpen && (
                  <div className="ring-opacity-6 absolute top-full right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white ring-1 ring-gray-200">
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
              <div className="relative flex items-center">
                <button
                  onClick={() => {
                    setShowTierModal(true);
                    setTierView('list');
                  }}
                  className="btn_admin_outline flex items-center gap-x-[2px]"
                >
                  <AdminPlusCircleIcon />
                  <span className="hidden md:block">Tier</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {creators.length > 0 ? (
          <div className="h-full rounded-b-[20px] bg-white px-[24px]">
            {renderContent()}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-b-[20px] bg-white px-[24px] py-[48px]">
            <p className="text-base font-medium text-gray-500">No creators found</p>
            <p className="mt-1 text-sm text-gray-400">
              {searchValue
                ? 'Try adjusting your search'
                : 'Creators will appear here once they register'}
            </p>
          </div>
        )}
        {/* Pagination Controls */}
        {pagination.count > 0 && (
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() =>
                  handlePageChange(pagination.offset - pagination.limit)
                }
                disabled={pagination.offset === 0 || isLoading}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  handlePageChange(pagination.offset + pagination.limit)
                }
                disabled={
                  pagination.offset + pagination.limit >= pagination.count ||
                  isLoading
                }
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{pagination.offset + 1}</span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(
                      pagination.offset + pagination.limit,
                      pagination.count,
                    )}
                  </span>{' '}
                  of <span className="font-medium">{pagination.count}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-xs"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      handlePageChange(pagination.offset - pagination.limit)
                    }
                    disabled={pagination.offset === 0 || isLoading}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      handlePageChange(pagination.offset + pagination.limit)
                    }
                    disabled={
                      pagination.offset + pagination.limit >=
                        pagination.count || isLoading
                    }
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAssignModal && assigningCreator && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-[20px] bg-white p-[24px] shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-medium">Assign Tier</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningCreator(null);
                  setSelectedTierIdForAssign('');
                }}
                className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                aria-label="Close dialog"
              >
                <CloseIconTags />
              </button>
            </div>
            <p className="mb-4 text-sm text-[#8E8E93]">
              Assigning tier to{' '}
              <span className="font-medium text-[#121212]">
                {assigningCreator.full_name}
              </span>
            </p>
            {!assigningCreator.creator_code_id ? (
              <p className="text-sm text-red-500">
                This creator has no active creator code and cannot be assigned a tier.
              </p>
            ) : (
              <>
                <select
                  value={selectedTierIdForAssign}
                  onChange={(e) => setSelectedTierIdForAssign(e.target.value)}
                  className="adminsolid w-full"
                >
                  <option value="">Select a tier</option>
                  {tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} (Level {tier.level})
                    </option>
                  ))}
                </select>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssigningCreator(null);
                      setSelectedTierIdForAssign('');
                    }}
                    className="flex-1 rounded-[10px] border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignTier}
                    disabled={!selectedTierIdForAssign || isAssigning}
                    className="btn_creators_solid flex-1 justify-center disabled:opacity-50"
                  >
                    {isAssigning ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showTierModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tier-modal-title"
        >
          <div className="w-full max-w-md rounded-[20px] bg-white p-[24px] shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 id="tier-modal-title" className="text-lg font-medium capitalize">
                {tierView === 'list'
                  ? 'Tiers'
                  : tierView === 'create'
                    ? 'New Tier'
                    : 'Edit Tier'}
              </h2>
              <button
                onClick={closeTierModal}
                className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-[#0072BB] focus-visible:outline-none"
                aria-label="Close dialog"
              >
                <CloseIconTags />
              </button>
            </div>

            {tierView === 'list' ? (
              <div className="space-y-4">
                <div className="max-h-[300px] overflow-y-auto">
                  {tiers?.map((tier) => (
                    <div
                      key={tier.id}
                      className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
                    >
                      <span className="text-[#121212]">
                        {tier.name} (Level {tier.level})
                      </span>
                      <button
                        onClick={() => {
                          setEditingTierId(tier.id);
                          setTierName(tier.name);
                          setTierLevel(tier.level?.toString() || '');
                          setTierDescription(tier.description || '');
                          setTierBaseRate(tier.base_rate?.toString() || '');
                          setTierMaxRate(tier.max_rate?.toString() || '');
                          setTierView('edit');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                  {(!tiers || tiers.length === 0) && (
                    <p className="text-sm text-[#8E8E93]">No tiers found.</p>
                  )}
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setTierName('');
                      setTierLevel('');
                      setTierDescription('');
                      setTierBaseRate('');
                      setTierMaxRate('');
                      setTierView('create');
                    }}
                    className="btn_creators_solid w-full justify-center"
                  >
                    Create New Tier
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="adminsolidlabel mb-2 block">
                    Tier Name
                  </label>
                  <input
                    type="text"
                    value={tierName}
                    onChange={(e) => setTierName(e.target.value)}
                    className="adminsolid w-full"
                    placeholder="Enter tier name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="adminsolidlabel mb-2 block">Description</label>
                  <input
                    type="text"
                    value={tierDescription}
                    onChange={(e) => setTierDescription(e.target.value)}
                    className="adminsolid w-full"
                    placeholder="Enter tier description"
                  />
                </div>
                <div>
                  <label className="adminsolidlabel mb-2 block">Level</label>
                  <input
                    type="number"
                    value={tierLevel}
                    onChange={(e) => setTierLevel(e.target.value)}
                    className="adminsolid w-full"
                    placeholder="Enter tier level"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="adminsolidlabel mb-2 block">Base Rate (%)</label>
                    <input
                      type="number"
                      value={tierBaseRate}
                      onChange={(e) => setTierBaseRate(e.target.value)}
                      className="adminsolid w-full"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="adminsolidlabel mb-2 block">Max Rate (%)</label>
                    <input
                      type="number"
                      value={tierMaxRate}
                      onChange={(e) => setTierMaxRate(e.target.value)}
                      className="adminsolid w-full"
                      placeholder="20"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setTierView('list');
                      setTierName('');
                      setTierLevel('');
                      setTierDescription('');
                      setTierBaseRate('');
                      setTierMaxRate('');
                    }}
                    className="flex-1 rounded-[10px] border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={
                      tierView === 'create'
                        ? handleCreateTier
                        : handleUpdateTier
                    }
                    disabled={!tierName.trim() || !tierLevel || isLoading}
                    className="btn_creators_solid flex-1 justify-center disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </GridContainer>
  );
}
