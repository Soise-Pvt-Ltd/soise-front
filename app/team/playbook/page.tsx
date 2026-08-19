export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'The Creator Playbook',
  description:
    'How the Swaz Creator Program is built — the way we find, score, and invite the creators shaping how Nigeria wears SOISE. Our rubric, our principles, our standard.',
  path: '/team/playbook',
  type: 'article',
  ogTitle: 'The Swaz Creator Playbook — SOISE',
  ogDescription:
    'How we find, score, and invite the creators shaping how Nigeria wears SOISE.',
});

/**
 * PRESSED INK — the storefront's editorial language run through a letterpress
 * (see the brut- tokens in globals.css and app/contact/page.tsx). This page is
 * public and shareable, so it gets the full editorial treatment: oversized
 * Instrument Serif masthead, index-numbered sections, ink plates, hard offset
 * shadows and the ad creatives' crimson (#B3101C) as the only accent.
 */

const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

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

/** Index number + rule — the editorial section head, pressed harder. */
function IndexHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-x-3">
      <span className="text-[12px] font-bold tracking-[0.08em] text-[#B3101C]">
        {n}
      </span>
      <span className="brut-label">{title}</span>
      <span className="brut-rule mt-auto mb-[6px] flex-1 opacity-20" />
    </div>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  // Stagger the CSS-only entrance in 0.06s steps off the section number, capped
  // so the last section never waits on a long chain.
  const step = Math.min(Number(n) || 0, 6) * 0.06;
  return (
    <section className="brut-rise mt-10" style={{ animationDelay: `${step}s` }}>
      <IndexHead n={n} title={title} />
      <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#3F3830]">
        {children}
      </div>
    </section>
  );
}

export default function PlaybookPage() {
  return (
    <div className="mx-auto max-w-[760px]">
      <header className="brut-rise">
        <p className="brut-label text-[#B3101C]">The Swaz Creator Program</p>
        <h1
          className="mt-4 text-[44px] leading-[0.95] tracking-tight uppercase sm:text-[64px]"
          style={serif}
        >
          Creator Outreach Playbook<span className="text-[#B3101C]">.</span>
        </h1>
        <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-[#3F3830]">
          How we find, evaluate, and invite creators — proactively and at scale,
          but always as an{' '}
          <span className="font-bold text-[#121212]">exclusive invitation</span>,
          never a discount blast. The premium voice is the thing that makes a
          creator want the code; protect it.
        </p>
      </header>

      {/* The single principle gets the one shadowed plate above the fold. */}
      <div
        className="brut-rise brut-plate brut-shadow mt-10 px-6 py-6"
        style={{ animationDelay: '0.08s' }}
      >
        <p className="text-[14px] leading-relaxed text-[#3F3830]">
          <span className="font-bold text-[#121212]">The one principle:</span>{' '}
          exclusivity is earned by real <em>selectivity</em> + a considered{' '}
          <em>experience</em>, not by the adjectives in the message. If we send
          “you’ve been selected” to 5,000 handles, creators smell it instantly.
          The discipline of who we <em>don’t</em> contact is the product.
        </p>
      </div>

      <div>
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
          {/* Dense rows: plate the container, rule the rows — never a shadow
              per row. */}
          <div className="brut-plate mt-2 divide-y-2 divide-[#121212]">
            {SCORECARD.map((s, i) => (
              <div key={s.field} className="flex gap-4 px-4 py-4">
                <span
                  className="mt-[2px] shrink-0 text-[18px] leading-none text-[#B3101C]"
                  style={serif}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-[14px] font-bold text-[#121212]">{s.key}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#5C544A]">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
            <span className="inline-flex rotate-[-2deg] items-center rounded-[2px] border-2 border-[#B3101C] px-3 py-1.5 font-bold tracking-[0.1em] text-[#B3101C] uppercase">
              A · 20–25 — invite now
            </span>
            <span className="inline-flex items-center rounded-[2px] border-2 border-[#121212] bg-white px-3 py-1.5 font-bold tracking-[0.1em] text-[#121212] uppercase">
              B · 14–19 — worth a thoughtful reach
            </span>
            <span className="inline-flex items-center rounded-[2px] border-2 border-[#121212]/25 px-3 py-1.5 font-bold tracking-[0.1em] text-[#5C544A] uppercase">
              C · under 14 — pass / revisit later
            </span>
          </div>
        </Section>

        <Section n="04" title="The hooks — lead with these, always">
          <p>
            Whatever else is in the message, these are what actually convert.
            Don’t bury them in paragraph three — they&apos;re the reason someone
            says yes.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <b>Their own code.</b> Personal, shareable, theirs — this is the
              single biggest hook. People want a code with their name on it
              before they want anything else.
            </li>
            <li>
              <b>Cash commission on every sale.</b> Real, withdrawable money,
              not points or store credit. Say “cash” explicitly — it&apos;s the
              word that makes it feel real.
            </li>
            <li>
              <b>Every 10 verified sales = ₦100,000 + free SOISE gear.</b> We
              add the bonus by hand to their payout when they withdraw — it is
              not automatic, so check their order count before you process one.
              This is the hook that turns a one-time code into a reason to keep
              pushing. Say the number. “Every 10 sales” is concrete and
              countable in a way “rewards over time” isn&apos;t.
            </li>
            <li>
              <b>First access to drops.</b> They wear it before it&apos;s public —
              status, not just product.
            </li>
            <li>
              <b>Founding-creator status.</b> Early means it stays with them as
              the program grows — better terms, permanently.
            </li>
          </ul>
        </Section>

        <Section n="05" title="The message — invitation, not a blast">
          <p>
            1:1 IG/TikTok DM (where creators live), email as backup. Never a group
            send. Structure: a specific opener about <em>their</em> work → the
            invitation → the hooks above, in order → one low-friction step.
          </p>
          <blockquote className="rounded-[2px] border-2 border-l-[6px] border-[#121212] border-l-[#B3101C] bg-white px-5 py-4 text-[13.5px] leading-relaxed italic">
            “Hi [name] — we’ve been watching your [specific thing, e.g.
            thrift-flip reels] and how your audience responds to the way you style
            fits. We’re opening a small first cohort of the Swaz Creator program —
            your own code, cash commission on every sale, a ₦100,000 bonus plus
            free SOISE gear every 10 verified sales, early access to drops
            before they’re public, and
            founding-creator status. We’re keeping it to ~25 people this round
            and I’d like one of them to be you. Want the details?”
          </blockquote>
          <p className="rounded-[2px] border-2 border-[#B3101C] bg-white px-4 py-3 text-[13px] leading-relaxed text-[#B3101C]">
            <b>What kills it:</b> 🔥💰 urgency emojis, “EARN BIG NOW,” generic “hey
            hun collab?”, anything that reads as copy-paste.
          </p>
        </Section>

        <Section n="06" title="Make the program feel exclusive — operationally">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Send invitees to{' '}
              <Link
                href="/join"
                className="font-bold text-[#B3101C] underline underline-offset-2"
              >
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

        <Section n="07" title="Where AI helps — and where it must not">
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

        <Section n="08" title="Cadence + measure">
          <p>
            One thoughtful follow-up max, then leave them be (nagging is
            off-brand). Track reply rate → application rate →{' '}
            <b>activation</b> (made a first sale) by source and tier in the prospect
            log, and pour effort into whatever actually activates creators.
          </p>
        </Section>
      </div>

      <footer
        className="brut-rise brut-rule mt-14 flex flex-wrap gap-3 pt-8"
        style={{ animationDelay: '0.42s' }}
      >
        <Link
          href="/team/prospects"
          className="brut-press inline-flex items-center rounded-[2px] border-2 border-[#121212] bg-[#121212] px-6 py-4 text-[13px] font-bold tracking-[0.1em] text-white uppercase"
        >
          Go to prospect log →
        </Link>
        <Link
          href="/team"
          className="brut-plate brut-press inline-flex items-center px-6 py-4 text-[13px] font-bold tracking-[0.1em] uppercase"
        >
          Back to overview
        </Link>
      </footer>
    </div>
  );
}
