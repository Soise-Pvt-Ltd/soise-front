'use client';

import { useEffect, useState } from 'react';
import GridContainer from '../gridContainer';
import { PageHeader, Panel, StatTile } from '../ui';
import { showToast } from '../toast';
import { getRestockSettings, saveRestockSettings, type RestockSettings } from './actions';

/**
 * A sold-out piece is still sold. Checkout never blocks on stock; instead the
 * order emails tell the shopper the piece is secured in the next restock,
 * "which happens in exactly N days". This page is where N comes from.
 */
export default function RestockClient() {
  const [settings, setSettings] = useState<RestockSettings | null>(null);
  const [date, setDate] = useState('');
  const [cycle, setCycle] = useState('14');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const apply = (s: RestockSettings) => {
    setSettings(s);
    setDate(s.nextRestockDate ?? '');
    setCycle(String(s.restockCycleDays));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getRestockSettings();
      if (res.success) apply(res.settings);
      else setLoadError(res.error);
      setLoading(false);
    })();
  }, []);

  const cycleNum = Number(cycle);
  const cycleValid = Number.isInteger(cycleNum) && cycleNum >= 1 && cycleNum <= 365;
  const dirty =
    settings !== null &&
    (date !== (settings.nextRestockDate ?? '') || cycleNum !== settings.restockCycleDays);

  const handleSave = async () => {
    if (!cycleValid) {
      showToast('error', 'Cycle must be a whole number of days between 1 and 365.');
      return;
    }
    setSaving(true);
    const res = await saveRestockSettings(date, cycleNum);
    setSaving(false);
    if (res.success) {
      apply(res.settings);
      showToast('success', `Saved. Backorder emails now read "in exactly ${res.settings.countdownDays} days".`);
    } else {
      showToast('error', res.error);
    }
  };

  const handleClearDate = () => setDate('');

  if (loading) {
    return (
      <GridContainer>
        <PageHeader eyebrow="The house" title="Restock" />
        <p className="text-[14px] text-[#5C544A]">Loading…</p>
      </GridContainer>
    );
  }

  if (loadError || !settings) {
    return (
      <GridContainer>
        <PageHeader eyebrow="The house" title="Restock" />
        <p className="text-[14px] text-[#B3261E]">{loadError || 'Could not load restock settings.'}</p>
      </GridContainer>
    );
  }

  return (
    <GridContainer>
      <PageHeader
        eyebrow="The house"
        title="Restock"
        description="When a shopper buys a piece that is sold out, the order goes through and their confirmation promises it from the next restock. Set the date of that drop here."
        actions={
          <button
            type="button"
            className="suite-btn-primary"
            onClick={handleSave}
            disabled={saving || !dirty || !cycleValid}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel eyebrow="Next drop" title="Restock date">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="suite-eyebrow">Next restock date</span>
              <input
                type="date"
                className="suite-input mt-1.5 w-full"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <span className="mt-2 block text-[12px] leading-relaxed text-[#5C544A]">
                Lagos calendar date. Leave empty to count one cycle from today instead.
                {date && (
                  <>
                    {' '}
                    <button
                      type="button"
                      className="underline underline-offset-2"
                      onClick={handleClearDate}
                    >
                      Clear date
                    </button>
                  </>
                )}
              </span>
            </label>
            <label className="block">
              <span className="suite-eyebrow">Days between restocks</span>
              <input
                type="number"
                min={1}
                max={365}
                step={1}
                inputMode="numeric"
                className="suite-input mt-1.5 w-full"
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
              />
              <span className="mt-2 block text-[12px] leading-relaxed text-[#5C544A]">
                Once the date passes, the countdown rolls forward by this many days at a time, so
                the promise never reads zero.
              </span>
            </label>
          </div>
        </Panel>

        <div className="space-y-4">
          <StatTile
            label="Emails read today"
            value={`${settings.countdownDays} ${settings.countdownDays === 1 ? 'day' : 'days'}`}
            meta={
              <span className="text-[12px] leading-relaxed text-[#5C544A]">
                {settings.source === 'admin'
                  ? 'From the date and cycle saved here.'
                  : 'Server default — nothing saved here yet.'}
              </span>
            }
          />
          <Panel eyebrow="What the shopper sees">
            <p className="text-[13px] leading-relaxed text-[#5C544A]">
              “Unfortunately, the piece you selected is currently unavailable — but don’t worry.
              We’ve secured your piece in the next restock, which happens in exactly{' '}
              <strong className="text-[#14110E]">
                {settings.countdownDays} {settings.countdownDays === 1 ? 'day' : 'days'}
              </strong>
              .”
            </p>
            <p className="mt-3 text-[12px] leading-relaxed text-[#5C544A]">
              Shown on the order confirmation and the payment receipt, only for pieces whose stock
              could not cover the order. The number is recalculated on the day each email is sent.
            </p>
          </Panel>
        </div>
      </div>
    </GridContainer>
  );
}
