'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AdminSoundLevelsIcon,
  AdminMoreVerticalIcon,
  CloseIconTags,
} from '@/components/icons';
import GridContainer from '../gridContainer';
import { PageHeader, Badge, type Tone } from '../ui';
import RowActionMenu from '@/components/admin/RowActionMenu';
import { updateUserRole } from './actions';
import { showToast } from '../toast';
import { totalRows } from '@/lib/pagination';

type User = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: string;
  order_count: any;
  total_spent: number;
  created_at: string;
};

interface UsersPageProps {
  initialData: User[];
  initialMeta: any;
  fetchServerData: (
    limit?: number,
    offset?: number,
    search?: string,
    period?: string,
    role?: string,
  ) => Promise<any>;
}

export default function UsersPage({
  initialData,
  initialMeta,
  fetchServerData,
}: UsersPageProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(
    null,
  );
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>(initialData || []);
  const [pagination, setPagination] = useState(
    initialMeta?.pagination || { limit: 50, offset: 0, count: 0 },
  );
  const fetchIdRef = useRef(0);
  const lastFetchRef = useRef({
    search: initialSearch,
    period: 'All Time',
    role: 'All',
    hasFetched: (initialData?.length ?? 0) > 0,
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Role → badge tone, drawn from the suite's shared badge set (../ui).
  const roleTone: Record<string, Tone> = {
    user: 'neutral',
    creator: 'warn',
    admin: 'bad',
    outreach: 'info',
  };

  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const periodOptions = [
    'All Time',
    'Last 7 Days',
    'Last 30 Days',
    'Last 90 Days',
  ];

  // Role filter (backend supports ?role=; previously no UI for it).
  const [roleFilter, setRoleFilter] = useState('All');
  const roleOptions = ['All', 'user', 'creator', 'outreach', 'admin'];

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
    if (!showRoleModal) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowRoleModal(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showRoleModal]);

  useEffect(() => {
    const next = {
      search: searchQuery,
      period: selectedPeriod,
      role: roleFilter,
    };
    if (
      lastFetchRef.current.hasFetched &&
      next.search === lastFetchRef.current.search &&
      next.period === lastFetchRef.current.period &&
      next.role === lastFetchRef.current.role
    ) {
      return;
    }

    const timer = setTimeout(() => {
      handleFilterChange();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedPeriod, roleFilter]);

  const handleFilterChange = async () => {
    const id = ++fetchIdRef.current;
    lastFetchRef.current = {
      search: searchQuery,
      period: selectedPeriod,
      role: roleFilter,
      hasFetched: true,
    };
    setIsLoading(true);
    const result = await fetchServerData(
      pagination.limit,
      0,
      searchQuery,
      selectedPeriod,
      roleFilter,
    );
    if (id !== fetchIdRef.current) return;
    if (result.success) {
      setUsers(result.data);
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
      searchQuery,
      selectedPeriod,
      roleFilter,
    );
    if (id !== fetchIdRef.current) return;
    if (result.success) {
      setUsers(result.data);
      setPagination(result.meta.pagination);
    } else {
      showToast('error', 'Could not load that page. Please try again.');
    }
    setIsLoading(false);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    try {
      const result = await updateUserRole(selectedUser.id, selectedRole);
      if (result.success) {
        setShowRoleModal(false);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, role: selectedRole } : u,
          ),
        );
        showToast('success', `Role updated to ${selectedRole}`);
      } else {
        showToast('error', result.error || 'Failed to update role');
      }
    } catch (error) {
      showToast('error', 'An error occurred while updating the role');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GridContainer>
      <PageHeader
        eyebrow="The people"
        title="Users"
        description="Everyone who has an account with Soise — customers, creators and admins. Roles can be changed here."
      />

      <div className="">
        <div className="rounded-t-[14px] border border-[#E2DBCC] bg-[#FBF9F4] px-[24px] py-[24px] text-[#14110E]">
          <div className="flex items-center justify-between gap-x-2">
            <input
              type="text"
              placeholder="Search users..."
              aria-label="Search users"
              className="h-[36px] w-full rounded-full border border-[#DFD7C6] bg-[#EFEBE1] text-[#14110E] placeholder:text-[#8C8377] text-[12px] outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#9C6F2E] md:w-[245px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="flex items-center gap-x-2">
            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-[36px] cursor-pointer rounded-[10px] border-2 border-[#EFEAE0] bg-[#FBF9F4] px-2 text-[12px] text-[#8C8377] outline-none focus-visible:ring-2 focus-visible:ring-[#9C6F2E]"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r === 'All' ? 'All roles' : r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>

            <div ref={filterDropdownRef} className="relative flex items-center">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="btn_admin_outline flex items-center gap-x-[2px] whitespace-nowrap"
                aria-label="Filter by time period"
                aria-expanded={isDropdownOpen}
              >
                <AdminSoundLevelsIcon />
                <span className="hidden md:block">{selectedPeriod}</span>
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full right-0 z-30 mt-2 w-32 origin-top-right rounded-[10px] border border-[#E2DBCC] bg-[#FBF9F4] shadow-[0_18px_40px_-20px_rgba(20,17,14,0.35)]">
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
            </div>
          </div>
        </div>
        <div className="rounded-b-[14px] border border-t-0 border-[#E2DBCC] bg-[#FBF9F4] px-[24px]">
          {isLoading && (
            <div className="py-4 text-center text-sm text-[#8C8377]">
              Loading...
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr>
                  <th scope="col" className="thead">
                    Name
                  </th>
                  <th scope="col" className="thead">
                    Role
                  </th>
                  <th scope="col" className="thead">
                    Email
                  </th>
                  <th scope="col" className="thead whitespace-nowrap">
                    No. of Orders
                  </th>
                  <th scope="col" className="thead whitespace-nowrap">
                    Total Spent
                  </th>
                  <th scope="col" className="thead">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index, arr) => (
                  <tr key={user.id} className="suite-row">
                    <td className="td">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="td">
                      <Badge tone={roleTone[user.role] ?? 'neutral'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="td">{user.email}</td>
                    <td className="td">
                      {user.order_count?.count ?? user.order_count ?? 0}
                    </td>
                    <td className="td">
                      ₦{(user.total_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="td">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            const next =
                              activeActionMenuId === user.id ? null : user.id;
                            setMenuAnchorEl(next ? e.currentTarget : null);
                            setActiveActionMenuId(next);
                          }}
                          className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] bg-[#EFEBE1] outline-none transition-colors duration-150 hover:bg-[#E2DBCC] focus-visible:ring-2 focus-visible:ring-[#9C6F2E]"
                          aria-label={`Actions for ${user.first_name} ${user.last_name}`}
                          aria-expanded={activeActionMenuId === user.id}
                        >
                          <AdminMoreVerticalIcon />
                        </button>
                        <RowActionMenu
                          open={activeActionMenuId === user.id}
                          onClose={() => {
                            setActiveActionMenuId(null);
                            setMenuAnchorEl(null);
                          }}
                          anchorEl={menuAnchorEl}
                        >
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setSelectedRole(user.role);
                              setShowRoleModal(true);
                              setActiveActionMenuId(null);
                            }}
                            className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#3F3830] hover:bg-[#EFEAE0]"
                          >
                            Change Role
                          </button>
                        </RowActionMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
                <span className="font-medium">{pagination.offset + 1}</span> to{' '}
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
                    pagination.offset + pagination.limit >= totalRows(pagination) ||
                    isLoading
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

      {showRoleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0E10]/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
        >
          <div className="w-full max-w-md rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-[24px] shadow-[0_30px_80px_-30px_rgba(20,17,14,0.5)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 id="role-modal-title" className="suite-display text-[20px] text-[#14110E] capitalize">Change Role</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[#EFEAE0] focus-visible:ring-2 focus-visible:ring-[#9C6F2E] focus-visible:outline-none"
                aria-label="Close dialog"
              >
                <CloseIconTags />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                {/* <label className="adminsolidlabel mb-2 block">Role</label> */}
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="adminsolid w-full"
                >
                  <option value="user">User</option>
                  <option value="creator">Creator</option>
                  <option value="outreach">Outreach (creator team)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 rounded-[10px] border border-[#DFD7C6] px-4 py-2 text-sm font-medium text-[#3F3830] hover:bg-[#EFEBE1]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  disabled={isLoading}
                  className="btn_creators_solid flex-1 justify-center disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </GridContainer>
  );
}
