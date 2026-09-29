import React from "react";
import {
  FileText,
  ShieldCheck,
  Users,
  Sparkles,
  Ban,
  RefreshCw,
  AlertTriangle,
  Mail,
  Scale,
} from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">

      {/* ── Hero ── */}
      <section className="relative bg-[#0f1b35] rounded-2xl px-10 py-16 text-center overflow-hidden">
        <span className="inline-flex items-center gap-2 text-[#EAA800] text-sm border border-[#EAA800]/30 bg-[#EAA800]/10 px-4 py-1.5 rounded-full mb-5">
          <Scale size={14} />
          Legal
        </span>
        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
          Terms & <span className="text-[#EAA800]">Conditions</span>
        </h1>
        <p className="text-white/55 max-w-xl mx-auto text-sm leading-relaxed">
          Please read these terms carefully before using VaultArchve, the
          official digital thesis repository of Guagua Community College.
        </p>
        <p className="text-white/30 text-xs mt-5">
          Last updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </section>

      {/* ── Intro ── */}
      <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-8">
        <p className="text-[#EAA800] text-xs font-semibold uppercase tracking-widest mb-2">
          Acceptance of terms
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-5">
          Using VaultArchve means agreeing to these terms
        </h2>

        <p className="border-l-4 border-[#EAA800] pl-5 text-gray-800 dark:text-gray-200 text-base leading-relaxed mb-6">
          By accessing or using VaultArchve ("the Platform"), operated by
          Guagua Community College ("GCC", "we", "us"), you agree to be bound
          by these Terms & Conditions. If you do not agree, please do not use
          the Platform.
        </p>

        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">
          The Platform is intended for GCC students, research coordinator, staff, and
          researchers. Some features — such as browsing and reading published
          theses — may be available to the public, while submission, review,
          and administrative features are restricted to authorized accounts.
        </p>
      </section>

      {/* ── Account & Content pillars ── */}
      <section>
        <p className="text-[#EAA800] text-xs font-semibold uppercase tracking-widest mb-4">
          Your responsibilities
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: <ShieldCheck size={20} />,
              title: "Account security",
              desc: "Keep your login credentials confidential and accurate.",
            },
            {
              icon: <FileText size={20} />,
              title: "Original work",
              desc: "Submitted theses must be your own and free of plagiarism.",
            },
            {
              icon: <Ban size={20} />,
              title: "Acceptable use",
              desc: "No unauthorized access, scraping, or misuse of AI features.",
            },
            {
              icon: <Users size={20} />,
              title: "Community respect",
              desc: "Content and conduct should stay respectful and academic.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 text-center"
            >
              <div className="text-[#EAA800] flex justify-center mb-3">{f.icon}</div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {f.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── IP + AI ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          {
            icon: <FileText size={22} />,
            title: "Intellectual property",
            body: "Theses uploaded to VaultArchve remain the intellectual property of their respective authors. By submitting a thesis, you grant GCC a non-exclusive, royalty-free license to store, index, display, and make the work available for academic and research purposes through the Platform.",
          },
          {
            icon: <Sparkles size={22} />,
            title: "AI-assisted features",
            body: "The Platform includes AI-generated features such as thesis title recommendations and the Progressive Trail guidance tool. These outputs are suggestions only, may contain inaccuracies, and should be verified with your adviser or faculty before being relied upon academically.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-6"
          >
            <div className="text-[#EAA800] mb-3">{item.icon}</div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {item.body}
            </p>
          </div>
        ))}
      </div>

      {/* ── Availability & Liability ── */}
      <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-8">
        <p className="text-[#EAA800] text-xs font-semibold uppercase tracking-widest mb-2">
          Good to know
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-5">
          Availability, changes & liability
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          <div>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-sm mb-2">
              <RefreshCw size={16} className="text-[#EAA800]" />
              Changes to the Platform
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              We may modify, suspend, or discontinue any part of the Platform
              at any time. We may also update these Terms periodically;
              continued use after changes means you accept the revised Terms.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-sm mb-2">
              <AlertTriangle size={16} className="text-[#EAA800]" />
              Limitation of liability
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              VaultArchve is provided "as is." GCC is not liable for any
              indirect, incidental, or consequential damages arising from your
              use of the Platform, including reliance on AI-generated
              suggestions.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#0f1b35] rounded-2xl px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">
          Questions about these terms?
        </h2>
        <p className="text-white/50 text-sm mb-8 max-w-md mx-auto leading-relaxed">
          Reach out to the GCC library team and we'll be glad to help.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          
            <Link href="mailto:library@gcc.edu.ph"
            className="inline-flex items-center gap-2 bg-[#EAA800] text-[#2a1a00] font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-yellow-400 transition-colors"
          >
            <Mail size={15} />
            library@gcc.edu.ph
          </Link>
          
            <Link href="/privacy"
            className="inline-flex items-center gap-2 border border-white/20 text-white px-6 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors"
          >
            <ShieldCheck size={15} />
            Privacy Policy
          </Link>
        </div>
      </section>

    </main>
  );
}