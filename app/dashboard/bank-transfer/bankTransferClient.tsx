'use client';

import { useEffect, useState } from 'react';
import GridContainer from '../gridContainer';
import { PageHeader, Panel, StatTile } from '../ui';
import { showToast } from '../toast';
import {
  getBankTransferSettings,
  saveBankTransferSettings,
  type BankTransferSettings,
} from './actions';

/**
 * The account the checkout's "Pay by bank transfer" button shows. Bachs is
 * the card rail; this is the second door, and most Nigerian commerce walks
 * through it. All three fields or nothing — a bank name without an account
 * number is a checkout that says "pay" and can't say where.
 */
export default function BankTransferClient() {
  const [settings, setSettings] = useState<BankTransferSettings | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const apply = (s: BankTransferSettings) => {
    setSettings(s);
    setBankName(s.bankName);
    setAccountNumber(s.accountNumber);
    setAccountName(s.accountName);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getBankTransferSettings();
      if (res.success) apply(res.settings);
      else setLoadError(res.error);
      setLoading(false);
    })();
  }, []);

  const filled = [bankName, accountNumber, accountName].filter((v) => v.trim()).length;
  const consistent = filled === 0 || filled === 3;
  const nubanOk = !accountNumber.trim() || /^\d{10}$/.test(accountNumber.trim());
  const dirty =
    settings !== null &&
    (bankName !== settings.bankName ||
      accountNumber !== settings.accountNumber ||
      accountName !== settings.accountName);

  const handleSave = async () => {
    if (!consistent) {
      showToast('error', 'Fill in all three fields, or clear all three to switch the rail off.');
      return;
    }
    if (!nubanOk) {
      showToast('error', 'Nigerian account numbers are 10 digits.');
      return;
    }
    setSaving(true);
    const res = await saveBankTransferSettings(bankName.trim(), accountNumber.trim(), accountName.trim());
    setSaving(false);
    if (res.success) {
      apply(res.settings);
      showToast(
        'success',
        res.settings.enabled
          ? 'Saved. Checkout now offers "Pay by bank transfer".'
          : 'Saved. The transfer button is hidden until all three fields are set.',
      );
    } else {
      showToast('error', res.error);
    }
  };

  if (loading) {
    return (
      <GridContainer>
        <PageHeader eyebrow="The house" title="Bank transfer" />
        <p className="text-[14px] text-[#5C544A]">Loading…</p>
      </GridContainer>
    );
  }

  if (loadError || !settings) {
    return (
      <GridContainer>
        <PageHeader eyebrow="The house" title="Bank transfer" />
        <p className="text-[14px] text-[#B3261E]">{loadError || 'Could not load bank transfer settings.'}</p>
      </GridContainer>
    );
  }

  return (
    <GridContainer>
      <PageHeader
        eyebrow="The house"
        title="Bank transfer"
        description="The account a shopper transfers into when they choose to pay by transfer instead of card. Shown at checkout and emailed with their order reference. Confirm each transfer from the Orders page once the money lands."
        actions={
          <button
            type="button"
            className="suite-btn-primary"
            onClick={handleSave}
            disabled={saving || !dirty || !consistent || !nubanOk}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel eyebrow="Receiving account" title="Where the money goes">
          <div className="grid gap-5">
            <label className="block">
              <span className="suite-eyebrow">Bank</span>
              <input
                type="text"
                className="suite-input mt-1.5 w-full"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Kuda, GTBank, Moniepoint"
              />
            </label>
            <label className="block">
              <span className="suite-eyebrow">Account number</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                className="suite-input mt-1.5 w-full"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit NUBAN"
              />
            </label>
            <label className="block">
              <span className="suite-eyebrow">Account name</span>
              <input
                type="text"
                className="suite-input mt-1.5 w-full"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Exactly as the bank shows it"
              />
              <span className="mt-2 block text-[12px] leading-relaxed text-[#5C544A]">
                Shoppers see this name when they add the beneficiary. It should match the registered
                business name so nothing looks off at the moment of trust.
              </span>
            </label>
          </div>
        </Panel>

        <div className="space-y-4">
          <StatTile
            label="Transfer rail"
            value={settings.enabled ? 'On' : 'Off'}
            meta={
              <span className="text-[12px] leading-relaxed text-[#5C544A]">
                {settings.enabled
                  ? 'Checkout offers "Pay by bank transfer" on naira orders.'
                  : settings.source === 'env'
                    ? 'Server default — nothing saved here yet.'
                    : 'Hidden until all three fields are set.'}
              </span>
            }
          />
          <Panel eyebrow="How it runs">
            <ol className="list-decimal space-y-2 pl-4 text-[13px] leading-relaxed text-[#5C544A]">
              <li>Shopper picks transfer at checkout; the order is held as pending payment with a reference like SOISE-0042-01.</li>
              <li>They see these details on the page and in their inbox, and send the screenshot on WhatsApp.</li>
              <li>You check the account, then open the order on the Orders page and press “Confirm bank transfer”.</li>
              <li>That marks it paid, sends the receipt, updates stock and moves it to processing — same as a card payment.</li>
            </ol>
          </Panel>
        </div>
      </div>
    </GridContainer>
  );
}
