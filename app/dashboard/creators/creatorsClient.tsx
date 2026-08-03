'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import GridContainer from '../gridContainer';
import { PageHeader } from '../ui';
import RowActionMenu from '@/components/admin/RowActionMenu';
import {
  AdminSoundLevelsIcon,
  AdminMoreVerticalIcon,
  AdminBadge1,
  AdminBadge2,
  AdminBadge3,
  AdminPlusCircleIcon,
  CloseIconTags,
} from '@/components/icons';
import {
  fetchTiers,
  createTier,
  updateTier,
  assignTierToCreator,
  changeCreatorCodeAdmin,
  revokeCreatorAdmin,
} from './actions';
import { showToast } from '../toast';
import { totalRows } from '@/lib/pagination';

type Creator = {
  id: string;
  creator_code_id?: string;
  creator_code?: string;
  role?: string;
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
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [searchValue, setSearchValue] = useState<string>(initialSearch);
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [creators, setCreators] = useState<Creator[]>(initialData || []);
  const [pagination, setPagination] = useState(
    initialMeta?.pagination || { limit: 50, offset: 0, count: 0 },
  );
  const [isLoading, setIsLoading] = useState(false);
  const fetchIdRef = useRef(0);
  const lastFetchRef = useRef({
    search: initialSearch,
    period: 'All Time',
    hasFetched: (initialData?.length ?? 0) > 0,
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const [showTierModal, setShowTierModal] = useState(false);
  const [tierView, setTierView] = useState<'list' | 'create' | 'edit'>('list');
  const [tiers, setTiers] = useState<any[]>([]);
  const [isTiersLoading, setIsTiersLoading] = useState(false);
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

  // Admin "change code" modal (overrides the 24h window).
  const [codeModalCreator, setCodeModalCreator] = useState<Creator | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [isChangingCode, setIsChangingCode] = useState(false);

  // Revoke creator status. Confirmed explicitly because it deactivates their
  // code and demotes the account -- not something to fire off a menu click.
  const [revokingCreator, setRevokingCreator] = useState<Creator | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  const submitRevoke = async () => {
    if (!revokingCreator || isRevoking) return;
    setIsRevoking(true);
    const res = await revokeCreatorAdmin(revokingCreator.id, revokeReason);
    setIsRevoking(false);
    if (res.success) {
      showToast(
        'success',
        res.data?.role_demoted === false && revokingCreator.role !== 'creator'
          ? `Code revoked — ${revokingCreator.full_name || 'they'} keeps ${revokingCreator.role} access`
          : `${revokingCreator.full_name || 'Creator'} can no longer earn — they can re-apply any time`,
      );
      setRevokingCreator(null);
      setRevokeReason('');
      refresh();
    } else {
      showToast('error', res.error || 'Could not revoke creator status');
    }
  };

  const submitCodeChange = async (randomize: boolean) => {
    if (!codeModalCreator || isChangingCode) return;
    setIsChangingCode(true);
    const res = await changeCreatorCodeAdmin(
      codeModalCreator.id,
      randomize ? undefined : codeInput.trim(),
    );
    setIsChangingCode(false);
    if (res.success) {
      showToast('success', `Code updated to ${res.data?.code ?? 'new code'}`);
      setCodeModalCreator(null);
      setCodeInput('');
      // Without this the table keeps showing the old code until the admin
      // reloads — the one mutation here that used to leave a stale row.
      refresh();
    } else {
      showToast('error', res.error || 'Could not change code');
    }
  };

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
    const next = {
      search: searchValue,
      period: selectedPeriod,
    };
    if (
      lastFetchRef.current.hasFetched &&
      next.search === lastFetchRef.current.search &&
      next.period === lastFetchRef.current.period
    ) {
      return;
    }

    const timer = setTimeout(() => {
      handleFilterChange();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, selectedPeriod]);

  const handleFilterChange = async () => {
    const id = ++fetchIdRef.current;
    lastFetchRef.current = {
      search: searchValue,
      period: selectedPeriod,
      hasFetched: true,
    };
    setIsLoading(true);
    const result = await fetchServerData(
      pagination.limit,
      0,
      searchValue,
      selectedPeriod,
    );
    if (id !== fetchIdRef.current) return;
    if (result.success) {
      setCreators(result.data);
      setPagination({ ...result.meta.pagination, offset: 0 });
    } else {
      // Without this the spinner simply stops and the previous rows stay on
      // screen under the newly-selected tab, so a failed refetch is
      // indistinguishable from a filter that returned those rows.
      showToast('error', 'Could not refresh the list. Showing the previous results.');
    }
    setIsLoading(false);
  };

  const handlePageChange = async (newOffset: number) => {
    if (newOffset < 0 || newOffset >= totalRows(pagination)) return;
    const id = ++fetchIdRef.current;
    setIsLoading(true);
    const result = await fetchServerData(
      pagination.limit,
      newOffset,
      searchValue,
      selectedPeriod,
    );
    if (id !== fetchIdRef.current) return;
    if (result.success) {
      setCreators(result.data);
      setPagination(result.meta.pagination);
    } else {
      showToast('error', 'Could not load that page. Please try again.');
    }
    setIsLoading(false);
  };

  // Re-fetch the page the admin is currently looking at. Mutations used to call
  // handleFilterChange(), which snaps back to offset 0 and silently throws away
  // the admin's place in the list.
  const refresh = async () => {
    const id = ++fetchIdRef.current;
    setIsLoading(true);
    const result = await fetchServerData(
      pagination.limit,
      pagination.offset,
      searchValue,
      selectedPeriod,
    );
    if (id !== fetchIdRef.current) return;
    if (result.success) {
      setCreators(result.data);
      setPagination(result.meta.pagination);
    } else {
      showToast('error', 'Could not load that page. Please try again.');
    }
    setIsLoading(false);
  };

  const loadTiers = async () => {
    setIsTiersLoading(true);
    try {
      const result = await fetchTiers();
      if (result.success) {
        setTiers(result.data);
      } else {
        showToast('error', result.error || 'Could not load tiers');
      }
    } finally {
      setIsTiersLoading(false);
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
        refresh();
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
        refresh();
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
        refresh();
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
        <div className="py-4 text-center text-sm text-[#8C8377]">Loading...</div>
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
              Code
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
              <tr key={creator.id} className="ad-row">
                <td className="td">
                  <div className="flex items-center gap-x-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(creator.full_name || '?')}`}
                      alt={creator.full_name || 'Creator'}
                      className="size-8 rounded-full object-cover"
                    />
                    <div className="truncate">{creator.full_name}</div>
                    {creator.role && creator.role !== 'creator' && (
                      <span className="shrink-0 rounded-full bg-[#EFEBE1] px-2 py-0.5 text-[11px] font-medium text-[#5C544A] capitalize">
                        {creator.role}
                      </span>
                    )}
                  </div>
                </td>
                <td className="td">
                  <div className="flex items-center gap-x-1.5">
                    <span
                      style={{
                        color: creator.tier?.name
                          .toLowerCase()
                          .includes('tier 1')
                          ? '#9C6F2E'
                          : creator.tier?.name.toLowerCase().includes('tier 2')
                            ? '#8C8377'
                            : creator.tier?.name
                                  .toLowerCase()
                                  .includes('tier 3')
                              ? '#C4AA6E'
                              : '#5C544A',
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
                <td className="td">
                  {creator.creator_code ? (
                    <span className="font-mono tracking-wide text-[#14110E]">
                      {creator.creator_code}
                    </span>
                  ) : (
                    <span className="text-[#5C544A]">—</span>
                  )}
                </td>
                <td className="td">{creator.email}</td>
                <td className="td">₦{creator.sales_generated}</td>
                <td className="td">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        const next =
                          activeActionMenuId === creator.id ? null : creator.id;
                        setMenuAnchorEl(next ? e.currentTarget : null);
                        setActiveActionMenuId(next);
                      }}
                      className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] bg-[#EFEBE1] outline-none transition-colors duration-150 hover:bg-[#E2DBCC] focus-visible:ring-2 focus-visible:ring-[#9C6F2E]"
                      aria-label={`Actions for ${creator.full_name}`}
                      aria-expanded={activeActionMenuId === creator.id}
                    >
                      <AdminMoreVerticalIcon />
                    </button>
                    <RowActionMenu
                      open={activeActionMenuId === creator.id}
                      onClose={() => {
                        setActiveActionMenuId(null);
                        setMenuAnchorEl(null);
                      }}
                      anchorEl={menuAnchorEl}
                    >
                      <button
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#3F3830] hover:bg-[#EFEAE0]"
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
                      <button
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#3F3830] hover:bg-[#EFEAE0]"
                        onClick={() => {
                          setCodeModalCreator(creator);
                          setCodeInput('');
                          setActiveActionMenuId(null);
                        }}
                      >
                        {creator.creator_code_id ? 'Change code' : 'Assign code'}
                      </button>
                      <button
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#8C3A2B] hover:bg-[#F2E1DB]"
                        onClick={() => {
                          setRevokingCreator(creator);
                          setRevokeReason('');
                          setActiveActionMenuId(null);
                        }}
                      >
                        {creator.role === 'creator'
                          ? 'Revoke creator status'
                          : 'Revoke code'}
                      </button>
                    </RowActionMenu>
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
      <PageHeader
        eyebrow="The stage"
        title="Creators"
        description="The people the culture already follows. Tiers, codes and commission rates all live here."
      />

      <div className="">
        <div className="rounded-t-[14px] border border-[#E2DBCC] bg-[#FBF9F4] px-[24px] py-[24px] text-[#14110E]">
          <div className="flex flex-row items-center justify-between gap-x-2">
            <input
              type="text"
              placeholder="Search creators..."
              aria-label="Search creators"
              className="h-[36px] w-full rounded-full border border-[#DFD7C6] bg-[#EFEBE1] text-[#14110E] placeholder:text-[#8C8377] text-[12px] outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#9C6F2E] md:w-[245px]"
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
                  <div className="absolute top-full right-0 z-10 mt-2 w-32 origin-top-right rounded-[10px] border border-[#E2DBCC] bg-[#FBF9F4] shadow-[0_18px_40px_-20px_rgba(20,17,14,0.35)]">
                    <div className="py-1">
                      {periodOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSelectedPeriod(option);
                            setIsDropdownOpen(false);
                          }}
                          className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#8C8377] hover:bg-[#EFEAE0] hover:text-[#8C8377]"
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
          <div className="h-full rounded-b-[14px] border border-t-0 border-[#E2DBCC] bg-[#FBF9F4] px-[24px]">
            {renderContent()}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-b-[14px] border border-t-0 border-[#E2DBCC] bg-[#FBF9F4] px-[24px] py-[48px]">
            <p className="ad-display text-[18px] text-[#14110E]">No creators found</p>
            <p className="mt-2 max-w-[340px] text-[13px] leading-relaxed text-[#8C8377]">
              {searchValue
                ? 'Try adjusting your search'
                : 'Creators will appear here once they register'}
            </p>
          </div>
        )}
        {/* Pagination Controls */}
        {totalRows(pagination) > 0 && (
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() =>
                  handlePageChange(pagination.offset - pagination.limit)
                }
                disabled={pagination.offset === 0 || isLoading}
                className="relative inline-flex items-center rounded-[8px] border border-[#DFD7C6] bg-[#FBF9F4] px-4 py-2 text-sm font-medium text-[#3F3830] hover:bg-[#EFEBE1] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  handlePageChange(pagination.offset + pagination.limit)
                }
                disabled={
                  pagination.offset + pagination.limit >= totalRows(pagination) ||
                  isLoading
                }
                className="relative ml-3 inline-flex items-center rounded-[8px] border border-[#DFD7C6] bg-[#FBF9F4] px-4 py-2 text-sm font-medium text-[#3F3830] hover:bg-[#EFEBE1] disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[#3F3830]">
                  Showing{' '}
                  <span className="font-medium">{pagination.offset + 1}</span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(
                      pagination.offset + pagination.limit,
                      totalRows(pagination),
                    )}
                  </span>{' '}
                  of <span className="font-medium">{totalRows(pagination)}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-[8px] shadow-xs"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      handlePageChange(pagination.offset - pagination.limit)
                    }
                    disabled={pagination.offset === 0 || isLoading}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[#8C8377] ring-1 ring-[#DFD7C6] ring-inset hover:bg-[#EFEBE1] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
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
                        totalRows(pagination) || isLoading
                    }
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[#8C8377] ring-1 ring-[#DFD7C6] ring-inset hover:bg-[#EFEBE1] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
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

      {codeModalCreator && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0E10]/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-[24px] shadow-[0_30px_80px_-30px_rgba(20,17,14,0.5)]">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="ad-display text-[20px] text-[#14110E]">
                {codeModalCreator.creator_code_id
                  ? 'Change creator code'
                  : 'Assign creator code'}
              </h2>
              <button
                onClick={() => setCodeModalCreator(null)}
                aria-label="Close"
                className="text-[#5C544A] hover:text-[#14110E]"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-[13px] text-[#5C544A]">
              Set a custom code for{' '}
              <span className="font-medium text-[#14110E]">
                {codeModalCreator.full_name}
              </span>
              , or randomize one.{' '}
              {codeModalCreator.creator_code_id ? (
                <>
                  Current code:{' '}
                  <span className="font-mono text-[#14110E]">
                    {codeModalCreator.creator_code}
                  </span>
                  . This overrides the 24-hour limit.
                </>
              ) : (
                'This creator has no code yet — one will be created.'
              )}
            </p>
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. SWAZ-STAR (blank = randomize)"
              className="mb-4 w-full rounded-[10px] border border-[#DFD7C6] px-3 py-2 text-[14px] uppercase outline-none focus:border-[#9C6F2E]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => submitCodeChange(false)}
                disabled={isChangingCode || !codeInput.trim()}
                className="flex-1 rounded-[10px] bg-[#14110E] px-4 py-2.5 text-[14px] font-medium text-[#F4F1EA] disabled:opacity-40"
              >
                {isChangingCode ? '…' : 'Save custom code'}
              </button>
              <button
                onClick={() => submitCodeChange(true)}
                disabled={isChangingCode}
                className="rounded-full border border-[#9C6F2E] px-4 py-2.5 text-[14px] font-medium text-[#9C6F2E] transition-colors hover:bg-[#9C6F2E] hover:text-[#F4F1EA] disabled:opacity-40"
              >
                Randomize
              </button>
            </div>
          </div>
        </div>
      )}

      {revokingCreator && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0E10]/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-[24px] shadow-[0_30px_80px_-30px_rgba(20,17,14,0.5)]">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="ad-display text-[20px] text-[#14110E]">
                {revokingCreator.role === 'creator'
                  ? 'Revoke creator status'
                  : 'Revoke code'}
              </h2>
              <button
                onClick={() => setRevokingCreator(null)}
                aria-label="Close"
                className="text-[#5C544A] hover:text-[#14110E]"
              >
                ✕
              </button>
            </div>
            <p className="mb-3 text-[13px] text-[#5C544A]">
              <span className="font-medium text-[#14110E]">
                {revokingCreator.full_name}
              </span>
              {revokingCreator.creator_code ? (
                <>
                  {' '}
                  loses{' '}
                  <span className="font-mono text-[#14110E]">
                    {revokingCreator.creator_code}
                  </span>{' '}
                  and stops earning immediately.
                </>
              ) : (
                ' loses creator status immediately.'
              )}{' '}
              Any balance they&rsquo;ve already earned stays payable, and they
              can apply again at any time with no waiting period.
              {revokingCreator.role && revokingCreator.role !== 'creator' && (
                <>
                  {' '}
                  Their{' '}
                  <span className="font-medium text-[#14110E] capitalize">
                    {revokingCreator.role}
                  </span>{' '}
                  account and its access are not affected — only the code is
                  revoked.
                </>
              )}
            </p>
            <input
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Reason (optional, internal)"
              className="mb-4 w-full rounded-[10px] border border-[#DFD7C6] px-3 py-2 text-[14px] outline-none focus:border-[#9C6F2E]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRevokingCreator(null)}
                className="flex-1 rounded-[10px] border border-[#DFD7C6] px-4 py-2.5 text-[14px] font-medium text-[#3F3830] hover:bg-[#EFEBE1]"
              >
                Cancel
              </button>
              <button
                onClick={submitRevoke}
                disabled={isRevoking}
                className="flex-1 rounded-full bg-[#8C3A2B] px-4 py-2.5 text-[14px] font-medium text-[#F4F1EA] hover:bg-[#6E2C20] disabled:opacity-40"
              >
                {isRevoking ? 'Revoking…' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && assigningCreator && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0E10]/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-[24px] shadow-[0_30px_80px_-30px_rgba(20,17,14,0.5)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="ad-display text-[20px] text-[#14110E]">Assign Tier</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningCreator(null);
                  setSelectedTierIdForAssign('');
                }}
                className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[#EFEAE0]"
                aria-label="Close dialog"
              >
                <CloseIconTags />
              </button>
            </div>
            <p className="mb-4 text-sm text-[#5C544A]">
              Assigning tier to{' '}
              <span className="font-medium text-[#14110E]">
                {assigningCreator.full_name}
              </span>
            </p>
            {!assigningCreator.creator_code_id ? (
              <p className="text-sm text-[#8C3A2B]">
                This creator has no active creator code, so there is nothing to
                attach a tier to. Use &ldquo;Assign code&rdquo; on the row first.
              </p>
            ) : (
              <>
                <select
                  value={selectedTierIdForAssign}
                  onChange={(e) => setSelectedTierIdForAssign(e.target.value)}
                  className="adminsolid w-full"
                  disabled={isTiersLoading || tiers.length === 0}
                >
                  <option value="">
                    {isTiersLoading
                      ? 'Loading tiers…'
                      : tiers.length === 0
                        ? 'No tiers exist yet'
                        : 'Select a tier'}
                  </option>
                  {tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} (Level {tier.level})
                    </option>
                  ))}
                </select>
                {!isTiersLoading && tiers.length === 0 && (
                  <p className="mt-2 text-sm text-[#5C544A]">
                    Close this and use the “Tier” button to create one.
                  </p>
                )}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssigningCreator(null);
                      setSelectedTierIdForAssign('');
                    }}
                    className="flex-1 rounded-[10px] border border-[#DFD7C6] px-4 py-2 text-sm font-medium text-[#3F3830] hover:bg-[#EFEBE1]"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0E10]/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tier-modal-title"
        >
          <div className="w-full max-w-md rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-[24px] shadow-[0_30px_80px_-30px_rgba(20,17,14,0.5)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 id="tier-modal-title" className="ad-display text-[20px] text-[#14110E] capitalize">
                {tierView === 'list'
                  ? 'Tiers'
                  : tierView === 'create'
                    ? 'New Tier'
                    : 'Edit Tier'}
              </h2>
              <button
                onClick={closeTierModal}
                className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[#EFEAE0] focus-visible:ring-2 focus-visible:ring-[#9C6F2E] focus-visible:outline-none"
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
                      className="flex items-center justify-between border-b border-[#E2DBCC] py-3 last:border-0"
                    >
                      <span className="text-[#14110E]">
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
                        className="text-sm text-[#9C6F2E] hover:text-[#9C6F2E]"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                  {(!tiers || tiers.length === 0) && (
                    <p className="text-sm text-[#5C544A]">No tiers found.</p>
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
                    className="flex-1 rounded-[10px] border border-[#DFD7C6] px-4 py-2 text-sm font-medium text-[#3F3830] hover:bg-[#EFEBE1]"
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
