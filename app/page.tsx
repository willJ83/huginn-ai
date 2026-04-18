"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AppHeader from "@/app/components/AppHeader";
import WelcomeDemoSection from "@/app/components/WelcomeDemoSection";

type DemoIssue = { label: string; detail: string };
type DemoCardData = {
  title: string;
  punchline: string;
  score: number;
  issues: DemoIssue[];
  impact: string;
};

const DEMO_CARDS: DemoCardData[] = [
  {
    title: "Commercial Lease Agreement",
    punchline: "Locks you into long-term liability with no safe exit",
    score: 24,
    issues: [
      {
        label: "Forced Out-of-State Litigation",
        detail: "Any dispute forces you into Texas courts — increasing legal costs and making it significantly harder to defend yourself as a Florida business",
      },
      {
        label: "Hidden Auto-Renewal Clause",
        detail: "Miss the 60-day written notice window and the lease renews automatically, locking you in for another two full years with no exit",
      },
      {
        label: "No Cap on Personal Financial Exposure",
        detail: "The personal guarantee carries no damage ceiling — your personal assets are fully exposed if anything goes wrong for the duration of the lease",
      },
    ],
    impact: "You could be locked into this lease for years with full personal financial exposure and no clear path to exit.",
  },
  {
    title: "Vendor Supply Agreement",
    punchline: "Exposes you to unlimited claims with no protection",
    score: 31,
    issues: [
      {
        label: "Unlimited Damage Claims Allowed",
        detail: "The vendor can pursue uncapped damages for any alleged breach — there is no ceiling on what you could owe, even for minor disputes",
      },
      {
        label: "Mandatory Arbitration in Distant State",
        detail: "Every dispute must be resolved in Delaware — travel costs and filing fees fall on you before a single argument is heard",
      },
      {
        label: "Hidden Auto-Renewal Clause",
        detail: "Miss the 90-day cancellation window and you are bound for another full year at the same terms with no opportunity to renegotiate",
      },
    ],
    impact: "You may be responsible for large financial losses even in situations outside your control, with no contractual ceiling on your exposure.",
  },
  {
    title: "Independent Contractor Agreement",
    punchline: "Gives away your work and restricts your ability to earn",
    score: 28,
    issues: [
      {
        label: "Permanent Transfer of Your Work",
        detail: "Everything you create — including tools and templates you built before this engagement — transfers to the client permanently, with no compensation",
      },
      {
        label: "Statewide Non-Compete Restriction",
        detail: "This clause bars you from taking similar work anywhere in Florida for two years after the contract ends, directly cutting off your ability to earn",
      },
      {
        label: "Immediate Termination, Zero Notice",
        detail: "The client can end the engagement at any moment without warning — you have no financial protection and no minimum notice period",
      },
    ],
    impact: "You could lose ownership of your existing work and be blocked from earning in your field for two years after a single engagement.",
  },
  {
    title: "Marketing & Consulting Agreement",
    punchline: "Creates ongoing liability with no clear boundaries",
    score: 22,
    issues: [
      {
        label: "No Cap on Financial Exposure",
        detail: "No damage ceiling means you are personally exposed for any loss or claim tied to this agreement — including claims filed long after the work is done",
      },
      {
        label: "No Expiration on Confidentiality",
        detail: "This NDA covers all business discussions with no end date or defined scope — you could remain bound by obligations you cannot clearly identify",
      },
      {
        label: "Automatic Renewal Without Notice",
        detail: "The contract renews every six months automatically with no defined cancellation window — there is no clear, safe way to exit on schedule",
      },
    ],
    impact: "You could face ongoing financial liability and undefined confidentiality obligations long after the engagement ends.",
  },
];

function DemoCard({ card }: { card: DemoCardData }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Sample · Huginn Shield
          </p>
          <p className="font-semibold text-slate-900 text-sm leading-tight">{card.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{card.punchline}</p>
        </div>
        <span className="shrink-0 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-bold text-red-600">
          HIGH RISK
        </span>
      </div>

      {/* Risk bar */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-red-500 tabular-nums w-8 shrink-0">{card.score}</span>
          <div className="flex-1 min-w-0">
            {/* Dynamic width requires inline style — Tailwind cannot generate arbitrary runtime percentage values */}
            <div className="h-1.5 w-full rounded-full bg-slate-200">
              <div
                className="h-1.5 rounded-full bg-red-500"
                style={{ width: `${card.score}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              / 100 — {card.issues.length} critical issues
            </p>
          </div>
        </div>
      </div>

      {/* Issues */}
      <div className="px-5 py-4 flex flex-col gap-3 flex-1">
        {card.issues.map((issue, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 rounded bg-red-50 border border-red-200 px-1.5 py-0.5 text-[9px] font-bold text-red-700 whitespace-nowrap leading-4">
              {issue.label}
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">{issue.detail}</p>
          </div>
        ))}
      </div>

      {/* Impact */}
      <div className="px-5 py-3 bg-blue-50 border-t border-blue-100 flex items-start gap-2">
        <span className="text-sm shrink-0 mt-0.5" aria-hidden="true">🛡️</span>
        <div>
          <p className="text-xs font-semibold text-blue-800">Impact</p>
          <p className="text-xs text-blue-700 leading-relaxed mt-0.5">{card.impact}</p>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const { data: session } = useSession();
  const shieldHref = session ? "/shield" : "/signup";

  return (
    <>
      <AppHeader />

      <main>
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="bg-slate-900 px-6 py-20 sm:py-28 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-900/40 px-4 py-2 text-sm font-semibold text-blue-300 mb-6">
              <span aria-hidden="true">🛡️</span>
              HUGINN SHIELD — CONTRACT INTELLIGENCE
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              Know What You&rsquo;re Signing<br className="hidden sm:block" /> Before You Sign It
            </h1>

            <p className="mt-5 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Point your phone camera at any contract — get a full risk report in seconds.
              Jurisdiction analysis across all 50 states, built for Florida small businesses.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={shieldHref}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-8 py-4 text-lg font-semibold text-white transition"
              >
                <span aria-hidden="true">🛡️</span>
                Try Shield Free
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-slate-600 hover:border-slate-500 bg-slate-800 hover:bg-slate-700 px-8 py-4 text-base font-medium text-slate-200 transition"
              >
                See Pricing
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" aria-hidden="true" />
                2 free Deep Scans on every new account
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" />
                50-state jurisdiction analysis
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                No legal background required
              </span>
            </div>
          </div>
        </section>

        {/* ── Demo Section (above the fold on wide screens, first content below hero) ── */}
        <WelcomeDemoSection />

        {/* ── Trust bar ───────────────────────────────────────────────────── */}
        <section className="border-y border-slate-200 bg-white py-4 px-6">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-500">
            <li>🔒 Contract text is never stored — only your results are saved</li>
            <li>⚡ Results in under 30 seconds</li>
            <li>📱 Installable mobile app (PWA)</li>
            <li>🏢 Built in Melbourne, FL · Odens Eye Creative LLC</li>
          </ul>
        </section>

        {/* ── What Shield catches ─────────────────────────────────────────── */}
        <section className="bg-slate-50 py-16 px-6">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
                Real-World Examples
              </p>
              <h2 className="text-3xl font-bold text-slate-900">
                What Huginn Shield Catches
              </h2>
              <p className="mt-3 text-slate-600 max-w-xl mx-auto text-base">
                These are the kinds of contracts small businesses sign every day — and the
                problems Shield finds before it&rsquo;s too late.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {DEMO_CARDS.map((card) => (
                <DemoCard key={card.title} card={card} />
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href={shieldHref}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-8 py-4 text-base font-semibold text-white transition"
              >
                Scan Your Own Contract Free
                <span aria-hidden="true">→</span>
              </Link>
              <p className="mt-3 text-sm text-slate-500">
                No credit card required. 2 free Deep Scans included.
              </p>
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────────── */}
        <section className="bg-white py-16 px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              How Huginn Shield Works
            </h2>
            <div className="grid md:grid-cols-3 gap-10 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-4">1</div>
                <h3 className="font-semibold text-slate-900 mb-2">Point Your Camera</h3>
                <p className="text-slate-600 text-sm">
                  Take a photo of any contract — or upload a PDF, DOCX, or TXT. Multi-page contracts
                  supported: add pages one at a time before scanning.
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-4">2</div>
                <h3 className="font-semibold text-slate-900 mb-2">Shield Analyzes It</h3>
                <p className="text-slate-600 text-sm">
                  Huginn reads every clause — jurisdiction, governing law, auto-renewals, missing
                  protections, liability exposure, and Florida-specific disclosures.
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-4">3</div>
                <h3 className="font-semibold text-slate-900 mb-2">Get Your Risk Report</h3>
                <p className="text-slate-600 text-sm">
                  A clear risk score, plain-English explanations, and specific recommendations — in
                  under 30 seconds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── What Shield catches ─────────────────────────────────────────── */}
        <section className="bg-slate-50 py-16 px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-12">
              Stop Signing Contracts Blind
            </h2>
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Catch Costly Clauses</h3>
                <p className="text-slate-600 text-sm">
                  Auto-renewals, uncapped liability, one-sided termination — Shield finds what most
                  people miss until it&rsquo;s too late.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Know What&rsquo;s Missing</h3>
                <p className="text-slate-600 text-sm">
                  Missing liability caps, no dispute process, undefined jurisdiction — gaps can hurt
                  as much as bad clauses.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Never Miss a Deadline</h3>
                <p className="text-slate-600 text-sm">
                  Renewal windows, notice periods, obligation dates — pulled out automatically so
                  nothing sneaks up on you.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Know What to Do Next</h3>
                <p className="text-slate-600 text-sm">
                  Every flagged issue includes a plain-English recommendation so you know exactly
                  what to negotiate before you sign.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────────── */}
        <section id="pricing" className="bg-white py-20 px-6 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Simple Pricing</h2>
            <p className="text-slate-500 mb-2">
              Start with a 30-day free trial — no credit card required.
            </p>
            <p className="text-sm text-slate-400 mb-10">
              Subscribe when you&rsquo;re ready. Cancel anytime.
            </p>

            <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch text-left">
              {/* Starter */}
              <div className="flex-1 border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Starter</h3>
                <p className="text-3xl font-bold text-slate-900 mb-6">
                  $9.99<span className="text-base font-normal text-slate-500">/mo</span>
                </p>
                <ul className="text-slate-600 space-y-2 text-sm mb-8 flex-1">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    15 analyses per month
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    Risk scoring with severity levels
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    Clause-level recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    PDF export
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="block w-full text-center rounded-xl border border-blue-600 text-blue-600 px-6 py-3 font-semibold hover:bg-blue-50 transition"
                >
                  Start Free Trial
                </Link>
              </div>

              {/* Pro */}
              <div className="flex-1 border-2 border-blue-500 rounded-2xl p-8 shadow-sm relative flex flex-col">
                <div className="absolute -top-3 left-6 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mt-2 mb-2">Pro</h3>
                <p className="text-3xl font-bold text-slate-900 mb-4">
                  $29.99<span className="text-base font-normal text-slate-500">/mo</span>
                </p>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm mb-5">
                  <p className="font-semibold text-blue-700 mb-1">
                    Includes Huginn Shield Deep Scan
                  </p>
                  <p className="text-blue-600 text-xs leading-relaxed">
                    50-state jurisdiction analysis + F.S. §559.9613 FL checks.
                    Free &amp; Starter users get 2 trial Deep Scans.
                  </p>
                </div>

                <ul className="text-slate-600 space-y-2 text-sm mb-8 flex-1">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    70 analyses per month
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    Risk scoring with severity levels
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    Clause-level recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    PDF export
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    Priority support
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="block w-full text-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-semibold transition"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>

            <p className="mt-8 text-xs text-slate-400">
              This tool is not a substitute for professional legal advice. Secure checkout powered by Stripe.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
