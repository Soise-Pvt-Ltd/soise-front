'use client';

import { useRouter } from 'next/navigation';
import DashboardHeader from '../DashboardHeader';
import {
  EyeIcon,
  EyeOffIcon,
  CheckShieldIcon,
  ArrowLeftIcon,
} from '@/components/icons';
import { useState, useEffect } from 'react';
import { getWallet, requestPayout, getUserPayouts } from './actions';

export default function RequestPayoutPage() {
  const router = useRouter();
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [balance, setBalance] = useState(0);
  const [bankName, setBankName] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadWallet = async () => {
      setIsLoading(true);
      const result = await getWallet();
      if (result.success && result.data?.wallets) {
        const wallet = result.data.wallets;
        setBalance(wallet.balance || 0);
        setBankName(
          wallet.payout_metadata?.details?.bank_name || 'No bank set',
        );
      }
      setIsLoading(false);
    };
    loadWallet();
  }, []);

  const loadPayouts = async () => {
    const result = await getUserPayouts();
    if (result.success) {
      setPayouts(result.data || []);
    }
    setShowHistory(true);
  };

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMessage('Please enter a valid amount');
      return;
    }
    if (numAmount > balance) {
      setErrorMessage(
        `Insufficient balance. Available: ₦${balance.toLocaleString()}`,
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const result = await requestPayout(numAmount);
    if (result.success) {
      setSuccessMessage(
        'Payout requested successfully! Admin will confirm shortly.',
      );
      setAmount('');
      setBalance((prev) => prev - numAmount);
    } else {
      setErrorMessage(result.error || 'Failed to request payout');
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <DashboardHeader balance={balance} />
      <div className="mx-auto flex flex-col gap-[16px] px-[16px] py-[24px] md:max-w-7xl md:px-0">
        <div
          className="flex cursor-pointer items-center gap-x-2"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon />{' '}
          <span className="font-bold uppercase">Request payout</span>
        </div>
        <div className="space-y-[30px] rounded-[10px] bg-[#B3D5EB] px-[16px] py-[24px] text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2">
              <CheckShieldIcon />{' '}
              <span className="font-medium text-[#0072BB]">
                Available Balance
              </span>
            </div>
            <button
              onClick={loadPayouts}
              className="flex cursor-pointer items-center gap-x-2 text-white hover:underline"
            >
              Transaction History
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div
              className="w-fit cursor-pointer rounded-full bg-[#0072BB] p-[10px]"
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
            >
              {isBalanceVisible ? <EyeOffIcon /> : <EyeIcon />}
            </div>

            <div className="text-[20px] font-semibold text-white">
              {isLoading
                ? 'Loading...'
                : isBalanceVisible
                  ? `₦${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '✱✱✱✱✱✱✱'}
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="rounded-[10px] bg-[#CCEAD6] px-4 py-3 text-sm text-[#1B7A3D]">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="rounded-[10px] bg-[#E5C6BF] px-4 py-3 text-sm text-[#991C00]">
            {errorMessage}
          </div>
        )}

        {showHistory && (
          <div className="rounded-[10px] bg-white p-[16px]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">Transaction History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-sm text-[#8E8E93] hover:text-gray-600"
              >
                Close
              </button>
            </div>
            {payouts.length === 0 ? (
              <p className="text-sm text-[#8E8E93]">No payouts yet.</p>
            ) : (
              <div className="max-h-[200px] space-y-2 overflow-y-auto">
                {payouts.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border-b border-gray-100 py-2 text-sm last:border-0"
                  >
                    <div>
                      <span className="font-medium">
                        ₦{p.amount?.toLocaleString()}
                      </span>
                      <span className="ml-2 text-[#8E8E93]">
                        {formatDate(p.created_at)}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                        p.status === 'completed'
                          ? 'bg-[#CCEAD6] text-[#32AC5B]'
                          : p.status === 'failed'
                            ? 'bg-[#E5C6BF] text-[#991C00]'
                            : 'bg-[#F5F1CC] text-[#D8C732]'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="profile mt-[36px] space-y-[36px]">
          <div>
            <label htmlFor="amount_to_withdraw">Amount to withdraw</label>
            <input
              id="amount_to_withdraw"
              type="number"
              className="solid"
              placeholder="₦ 1,000"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrorMessage('');
              }}
            />
          </div>

          <div>
            <label htmlFor="funds_destination">Funds Destination</label>
            <input
              id="funds_destination"
              type="text"
              className="solid"
              value={bankName}
              disabled
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !amount}
          className="btn_creators_solid mt-[116px] mb-[64px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : 'Withdraw'}
        </button>
      </div>
    </div>
  );
}
