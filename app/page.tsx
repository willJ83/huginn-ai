"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AppHeader from "@/app/components/AppHeader";

export default function Page() {
  const { data: session } = useSession();
  const primaryCtaHref = session ? "/dashboard" : "/signup";

  return (
    <>
      <AppHeader />

      <main className="pageShell">
        <section className="w-full py-28 px-6 text-center bg-gradient-to-b from-white to-gray-100">
          <h1 className="text-4xl font-bold mb-6">
            Know What You're Signing Before You Sign It
          </h1>

          <p className="text-sm tracking-widest text-blue-600 mb-4">
            OBSERVE • ANALYZE • PROTECT
          </p>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Huginn AI reads your contracts and flags what could hurt your business — in plain English, in seconds. No lawyer needed.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-xl font-semibold text-white hover:bg-blue-700"
            >
              Get Started Free
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-400 text-center max-w-xl mx-auto">
            Built for everyday business contracts — vendor agreements, NDAs, freelance contracts, and service agreements. For complex enterprise deals, use Huginn as a smart first pass alongside legal counsel.
          </p>

        </section>

        <section className="py-4 px-6 border-t border-b border-gray-200">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-400">
            <li>🔒 Your contract text is never stored. Only your analysis results are saved to your account.</li>
            <li>⚡ Results in seconds</li>
            <li>🏢 Built by Odens Eye Creative LLC — Melbourne, FL</li>
            <li>✓ No legal expertise required</li>
          </ul>
        </section>

        <section className="py-16 px-6 bg-gray-50">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Huginn AI Analyzes Contracts
          </h2>

          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-4">1</div>
              <h3 className="font-semibold mb-2">Upload Contract</h3>
              <p className="text-gray-600">
                Upload a PDF, DOCX, or paste contract text into Huginn.
              </p>
            </div>

            <div>
              <div className="text-3xl font-bold text-blue-600 mb-4">2</div>
              <h3 className="font-semibold mb-2">Analyze Risk</h3>
              <p className="text-gray-600">
                Huginn reads every clause and flags what could cost you — risky terms, missing protections, hidden deadlines.
              </p>
            </div>

            <div>
              <div className="text-3xl font-bold text-blue-600 mb-4">3</div>
              <h3 className="font-semibold mb-2">Get Risk Report</h3>
              <p className="text-gray-600">
                Receive a clear report with risks, deadlines, and recommendations.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-6">
          <h2 className="text-2xl font-bold text-center mb-12">
            Every Analysis Includes
          </h2>

          <ul className="max-w-xl mx-auto space-y-3 text-gray-700">
            <li>✓ Contract Health Score</li>
            <li>✓ Plain-English Risk Summary</li>
            <li>✓ Issue Detection with Severity Ratings</li>
            <li>✓ Time-Sensitive Clause Extraction</li>
            <li>✓ Downloadable PDF Report</li>
          </ul>
        </section>

        <section id="features" className="py-16 px-6 bg-gray-50">
          <h2 className="text-2xl font-bold text-center mb-12">
            Stop Signing Contracts Blind
          </h2>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto text-center">
            <div>
              <h3 className="font-semibold mb-2">Catch the Clauses That Cost You</h3>
              <p className="text-gray-600">
                Auto-renewals, uncapped liability, one-sided termination — Huginn finds the terms most people miss until it's too late.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Know What's Missing</h3>
              <p className="text-gray-600">
                Missing liability caps, no dispute process, undefined jurisdiction — gaps in a contract can hurt as much as bad clauses.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Never Miss a Deadline</h3>
              <p className="text-gray-600">
                Renewal windows, notice periods, obligation dates — pulled out automatically so nothing sneaks up on you.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Know What to Do Next</h3>
              <p className="text-gray-600">
                Every flagged issue comes with a plain-English recommendation so you know exactly what to ask for before you sign.
              </p>
            </div>
          </div>
        </section>

        {/* Huginn Shield section */}
        <section className="py-16 px-6 text-center bg-slate-900 text-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl" aria-hidden="true">🛡️</span>
              <h2 className="text-2xl font-bold">Introducing Huginn Shield</h2>
            </div>
            <p className="text-slate-300 text-lg mb-8">
              Know exactly what you&apos;re signing — before you sign it.
            </p>

            <div className="grid md:grid-cols-3 gap-6 text-left mb-10">
              <div className="bg-slate-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-2">Jurisdiction &amp; Governing Law</h3>
                <p className="text-slate-400 text-sm">
                  Flags contracts that force you into out-of-state courts or unfavorable dispute venues.
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-2">50-State Jurisdiction Coverage</h3>
                <p className="text-slate-400 text-sm">
                  Deep Scan analyzes jurisdiction and governing law clauses across all 50 states. When Florida is selected, it also checks required disclosures under F.S. §559.9613. More states will be added over time.
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-2">Plain-English Warnings</h3>
                <p className="text-slate-400 text-sm">
                  Tells you exactly what to negotiate or walk away from — no legal jargon.
                </p>
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-2">
              Built for everyday business owners, contractors, and real estate professionals.
            </p>
            <p className="text-white font-semibold mb-2">
              Huginn Shield Deep Scan is included with Pro ($29.99/mo)
            </p>
            <p className="text-slate-400 text-sm mb-8">
              Free and Starter users get 2 free Deep Scans as a trial.
            </p>

            <Link
              href="/shield"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-400"
            >
              Try Huginn Shield
            </Link>
          </div>
        </section>

        <section id="pricing" className="py-20 px-6 text-center">
          <h2 className="text-2xl font-bold mb-3">Simple Pricing</h2>
          <p className="text-gray-500 mb-2">Start with 3 free analyses — no credit card required.</p>
          <p className="text-sm text-gray-400 mb-10">Subscribe when you&apos;re ready. Cancel anytime.</p>

          <div className="flex flex-col md:flex-row gap-6 max-w-3xl mx-auto justify-center items-stretch">
            {/* Starter */}
            <div className="flex-1 border rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Starter</h3>
              <p className="text-3xl font-bold mb-1">$9.99<span className="text-lg font-normal text-gray-500">/mo</span></p>

              <ul className="text-gray-600 mb-8 mt-6 space-y-2 text-left">
                <li>✓ 15 analyses per month</li>
                <li>✓ Risk scoring with severity levels</li>
                <li>✓ Clause-level recommendations</li>
                <li>✓ PDF export</li>
              </ul>

              <a
                href="/signup"
                className="block w-full border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50"
              >
                Start for Free
              </a>
            </div>

            {/* Pro */}
            <div className="flex-1 border-2 border-blue-500 rounded-xl p-8 shadow-sm relative">
              <div className="absolute -top-3 left-6 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-2 mt-2">Pro</h3>
              <p className="text-3xl font-bold mb-1">$29.99<span className="text-lg font-normal text-gray-500">/mo</span></p>

              <ul className="text-gray-600 mb-8 mt-6 space-y-2 text-left">
                <li>✓ 70 analyses per month</li>
                <li>✓ Risk scoring with severity levels</li>
                <li>✓ Clause-level recommendations</li>
                <li>✓ PDF export</li>
                <li>✓ Priority support</li>
              </ul>

              <a
                href="/signup"
                className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Start for Free
              </a>
            </div>
          </div>
        </section>

      </main>

      <style jsx>{`
        .pageShell {
          min-height: 100vh;
          padding: 36px 20px 52px;
          background:
            radial-gradient(
              circle at top left,
              rgba(37, 99, 235, 0.08),
              transparent 28%
            ),
            linear-gradient(180deg, #f7f9fc 0%, #eef2f7 100%);
          color: #0f172a;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
      `}</style>
    </>
  );
}
