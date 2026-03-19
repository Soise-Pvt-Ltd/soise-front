'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AdminSoundLevelsIcon,
  AdminMoreVerticalIcon,
  CloseIconTags,
} from '@/components/icons';
import GridContainer from '../gridContainer';
import { updateUserRole } from './actions';
import { showToast } from '../toast';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>(initialData || []);
  const [pagination, setPagination] = useState(
    initialMeta?.pagination || { limit: 50, offset: 0, count: 0 },
  );
  const isFirstRender = useRef(true);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const roleClasses: Record<string, string> = {
    user: 'bg-[#CCEAD6] text-[#32AC5B] border border-[#CCEAD6] rounded-full',
    creator: 'bg-[#F5F1CC] text-[#D8C732] border border-[#F5F1CC] rounded-full',
    admin: 'bg-[#E5C6BF] text-[#991C00] border border-[#E5C6BF] rounded-full',
  };

  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const periodOptions = [
    'All Time',
    'Last 7 Days',
    'Last 30 Days',
    'Last 90 Days',
  ];

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
    if (!showRoleModal) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowRoleModal(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showRoleModal]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      handleFilterChange();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedPeriod]);

  const handleFilterChange = async () => {
    setIsLoading(true);
    const result = await fetchServerData(
      pagination.limit,
      0,
      searchQuery,
      selectedPeriod,
    );
    if (result.success) {
      setUsers(result.data);
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
      searchQuery,
      selectedPeriod,
    );
    if (result.success) {
      setUsers(result.data);
      setPagination(result.meta.pagination);
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
      <div className="px-[16px]">
        <div className="py-[22px]">
          <span className="text-[20px] font-medium">Users</span>
        </div>
      </div>

      <div className="">
        <div className="rounded-t-[20px] border-b border-[#AEAEB266]/40 bg-white px-[24px] py-[24px] text-[#121212]">
          <div className="flex items-center justify-between gap-x-2">
            <input
              type="text"
              placeholder="Search users..."
              aria-label="Search users"
              className="h-[36px] w-full rounded-[10px] border-0 bg-[#F5F5F5] text-[12px] outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#0072BB] md:w-[245px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

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
          </div>
        </div>
        <div className="rounded-b-[20px] bg-white px-[24px]">
          {isLoading && (
            <div className="py-4 text-center text-sm text-gray-500">
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
                  <tr key={user.id}>
                    <td className="td">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="td">
                      <span
                        className={`px-2 py-1 text-xs font-medium capitalize ${
                          roleClasses[user.role] || roleClasses.user
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="td">{user.email}</td>
                    <td className="td">
                      {user.order_count?.count ?? user.order_count ?? 0}
                    </td>
                    <td className="td">
                      ₦{(user.total_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="td">
                      <div ref={activeActionMenuId === user.id ? actionMenuRef : undefined} className="relative">
                        <button
                          onClick={() =>
                            setActiveActionMenuId(
                              activeActionMenuId === user.id ? null : user.id,
                            )
                          }
                          className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] bg-[#F5F5F5] outline-none transition-colors duration-150 hover:bg-[#EBEBEB] focus-visible:ring-2 focus-visible:ring-[#0072BB]"
                          aria-label={`Actions for ${user.first_name} ${user.last_name}`}
                          aria-expanded={activeActionMenuId === user.id}
                        >
                          <AdminMoreVerticalIcon />
                        </button>
                        {activeActionMenuId === user.id && (
                          <div
                            className={`ring-opacity-5 absolute right-0 z-60 w-32 origin-top-right rounded-md bg-white text-sm shadow-md ring-1 ring-[#F5F5F5] focus:outline-none ${
                              index === arr.length - 1
                                ? 'bottom-full mb-2'
                                : 'mt-2'
                            }`}
                          >
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedRole(user.role);
                                  setShowRoleModal(true);
                                  setActiveActionMenuId(null);
                                }}
                                className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Change Role
                              </button>
                            </div>
                          </div>
                        )}
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
                <span className="font-medium">{pagination.offset + 1}</span> to{' '}
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
                    pagination.offset + pagination.limit >= pagination.count ||
                    isLoading
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

      {showRoleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
        >
          <div className="w-full max-w-md rounded-[20px] bg-white p-[24px] shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 id="role-modal-title" className="text-lg font-medium capitalize">Change Role</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-[#0072BB] focus-visible:outline-none"
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
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 rounded-[10px] border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
