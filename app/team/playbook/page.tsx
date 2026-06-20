export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Creator Playbook',
  description:
    'How the Swaz Creator Program is built — the way we find, score, and invite the creators shaping how Nigeria wears SOISE. Our rubric, our principles, our standard.',
  alternates: { canonical: '/team/playbook' },
  openGraph: {
    type: 'article',
    title: 'The Swaz Creator Playbook — SOISE',
    description:
      'How we find, score, and invite the creators shaping how Nigeria wears SOISE.',
    url: '/team/playbook',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Swaz Creator Playbook — SOISE',
    description:
      'How we find, score, and invite the creators shaping how Nigeria wears SOISE.',
    images: ['/og-image.jpg'],
  },
};

const SCORECARD = [
  {
    key: 'Aesthetic fit',
    field: 'score_aesthetic',
    desc: 'Does their grid already look like it belongs next to SOISE? This is the #1 filter — a mismatched creator cheapens the code no matter their size.',
  },
  {
    key: 'Engagement quality',
    field: 'score_engagement',
    desc: 'Real comments and saves, not just likes. A 6k account with a talking audience beats a 1M account with dead comments.',
  },
  {
    key: 'Audience overlap',
    field: 'score_audience',
    desc: 'Nigeria-based, right age, the kind of people who actually buy streetwear. Their followers should be our customers.',
  },
  {
    key: 'Posting cadence',
    field: 'score_cadence',
    desc: 'Consistent, current output. Someone who posts fits weekly will activate; a dormant account won’t.',
  },
  {
    key: 'Personal fit',
    field: 'score_fit',
    desc: '“Would I actually wear this / repost it?” The gut check that protects the brand.',
  },
];

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[#ECECEF] py-7 first:border-t-0 first:pt-0">
      <div className="flex items-baseline gap-3">
        <span className="text-[12px] font-semibold text-[#0072BB]">{n}</span>
        <h2 className="text-[18px] font-semibold tracking-tight text-[#121212]">
          {title}
        </h2>
      </div>
      <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-[#48484C]">
        {children}
      </div>
    </section>
  );
}

export default function PlaybookPage() {
  return (
    <div className="mx-auto max-w-[760px]">
      <header className="mb-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0072BB]">
          The Swaz Creator Program
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-[#121212]">
          Creator Outreach Playbook
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#6B6B70]">
          How we find, evaluate, and invite creators — proactively and at scale,
          but always as an{' '}
          <span className="font-medium text-[#121212]">exclusive invitation</span>,
          never a discount blast. The premium voice is the thing that makes a
          creator want the code; protect it.
        </p>
      </header>

      <div className="rounded-[14px] border border-[#E6E0F0] bg-[#FAF8FE] p-5">
        <p className="text-[14px] leading-relaxed text-[#4A4458]">
          <span className="font-semibold">The one principle:</span> exclusivity is
          earned by real <em>selectivity</em> + a considered <em>experience</em>,
          not by the adjectives in the message. If we send “you’ve been selected”
          to 5,000 handles, creators smell it instantly. The discipline of who we{' '}
          <em>don’t</em> contact is the product.
        </p>
      </div>

      <div className="mt-4">
        <Section n="01" title="Narrow the target before you write a word">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <b>Aesthetic / niche:</b> Nigerian streetwear, fashion, lifestyle
              creators whose feed already fits SOISE.
            </li>
            <li>
              <b>Size band:</b> lean into micro (≈2k–50k). High engagement,
              genuinely influential, hungry, not drowning in brand deals.
            </li>
            <li>
              <b>Intent signals:</b> they already tag brands, post fits, do “where
              I got this.” Pre-sold on the behaviour we want.
            </li>
            <li>
              <b>Geo:</b> Lagos / Abuja / PH first — delivery works, culture fits,
              IRL is possible later.
            </li>
          </ul>
        </Section>

        <Section n="02" title="Mine our own data first — warmest leads">
          <p>
            Before scraping strangers: repeat / high-AOV customers, anyone who has
            used a code, anyone who has tagged us. They convert far better and the
            “we noticed you” line is true. Then expand outward — who our existing
            creators follow, hashtag/geo discovery (#naijastreetwear,
            #lagosfashion), followers-of-followers.
          </p>
        </Section>

        <Section n="03" title="Score every prospect — the 5-point rubric">
          <p>
            Score each dimension <b>1–5</b> in the prospect log. The tool sums them
            (max 25) and assigns a tier automatically. Only contact A’s and B’s —
            the rubric <em>is</em> the exclusivity.
          </p>
          <div className="mt-2 overflow-hidden rounded-[12px] border border-[#ECECEF]">
            {SCORECARD.map((s, i) => (
              <div
                key={s.field}
                className={`flex gap-3 px-4 py-3 ${
                  i % 2 ? 'bg-[#FAFBFC]' : 'bg-white'
                }`}
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E7F1F8] text-[12px] font-semibold text-[#0072BB]">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[#121212]">
                    {s.key}
                  </p>
                  <p className="text-[13px] leading-relaxed text-[#6B6B70]">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
            <span className="rounded-full bg-[#E8F6EE] px-3 py-1 font-semibold text-[#1E7A45]">
              A · 20–25 — invite now
            </span>
            <span className="rounded-full bg-[#FBF4E0] px-3 py-1 font-semibold text-[#9A7B12]">
              B · 14–19 — worth a thoughtful reach
            </span>
            <span className="rounded-full bg-[#F1F1F3] px-3 py-1 font-semibold text-[#6B6B70]">
              C · under 14 — pass / revisit later
            </span>
          </div>
        </Section>

        <Section n="04" title="The message — invitation, not a blast">
          <p>
            1:1 IG/TikTok DM (where creators live), email as backup. Never a group
            send. Structure: a specific opener about <em>their</em> work → the
            invitation → what’s actually in it → one low-friction step.
          </p>
          <blockquote className="rounded-[12px] border-l-[3px] border-[#0072BB] bg-[#F7FAFD] px-4 py-3 text-[13.5px] italic leading-relaxed text-[#3A3A3E]">
            “Hi [name] — we’ve been watching your [specific thing, e.g.
            thrift-flip reels] and how your audience responds to the way you style
            fits. We’re opening a small first cohort of the Swaz Creator program —
            your own code, commission on every sale, early access to drops before
            they’re public, and founding-creator status. We’re keeping it to ~25
            people this round and I’d like one of them to be you. Want the
            details?”
          </blockquote>
          <p className="rounded-[10px] bg-[#FBEEEB] px-4 py-3 text-[13px] text-[#8A3320]">
            <b>What kills it:</b> 🔥💰 urgency emojis, “EARN BIG NOW,” generic “hey
            hun collab?”, anything that reads as copy-paste.
          </p>
        </Section>

        <Section n="05" title="Make the program feel exclusive — operationally">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Send invitees to{' '}
              <Link href="/join" className="font-medium text-[#0072BB] hover:underline">
                soise.ng/join
              </Link>{' '}
              — the public invitation page. It sells the program first, then hands
              off to signup → application (no cold login wall).
            </li>
            <li>
              Acceptance is a real gate (“applications reviewed within 48h”). Not
              everyone gets in — that’s the point.
            </li>
            <li>
              Run named <b>cohorts</b> (“Founding Creators · Cohort 1 — 25 seats”).
              Real scarcity, never fake countdowns.
            </li>
            <li>
              A considered onboarding (welcome note, their code, a one-pager on how
              to earn) seals the premium impression.
            </li>
          </ul>
        </Section>

        <Section n="06" title="Where AI helps — and where it must not">
          <p>
            <b>AI does:</b> enrich each candidate (niche, recent posts, fit score),
            draft a personalised first line per creator, organise everyone in the
            prospect log, triage replies.
          </p>
          <p>
            <b>Humans keep:</b> the final send, the judgement on fit, the
            relationship, and the voice. Every message must still read handwritten
            — AI gets you 80% of a personalised draft; a human spends 30 seconds
            making it real and hits send.
          </p>
        </Section>

        <Section n="07" title="Cadence + measure">
          <p>
            One thoughtful follow-up max, then leave them be (nagging is
            off-brand). Track reply rate → application rate →{' '}
            <b>activation</b> (made a first sale) by source and tier in the prospect
            log, and pour effort into whatever actually activates creators.
          </p>
        </Section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/team/prospects"
          className="inline-flex items-center gap-1.5 rounded-[9px] bg-[#0072BB] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#005c98]"
        >
          Go to prospect log →
        </Link>
        <Link
          href="/team"
          className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#DADADE] px-4 py-2.5 text-[13px] font-semibold text-[#48484C] transition-colors hover:bg-[#F4F4F6]"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}
