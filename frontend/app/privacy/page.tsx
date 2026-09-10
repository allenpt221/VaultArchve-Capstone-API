import {
  Lock,
  Database,
  Settings,
  Sparkles,
  Server,
  Share2,
  UserCheck,
  RefreshCw,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">

      {/* ── Hero ── */}
      <section className="relative bg-[#0f1b35] rounded-2xl px-10 py-16 text-center overflow-hidden">
        <span className="inline-flex items-center gap-2 text-[#EAA800] text-sm border border-[#EAA800]/30 bg-[#EAA800]/10 px-4 py-1.5 rounded-full mb-5">
          <Lock size={14} />
          Legal
        </span>
        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
          Privacy <span className="text-[#EAA800]">Policy</span>
        </h1>
        <p className="text-white/55 max-w-xl mx-auto text-sm leading-relaxed">
          How VaultArchve collects, uses, and protects your information as the
          official digital thesis repository of Guagua Community College.
        </p>
        <p className="text-white/30 text-xs mt-5">
          Last updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </section>

      {/* ── Overview ── */}
      <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-8">
        <p className="text-[#EAA800] text-xs font-semibold uppercase tracking-widest mb-2">
          Overview
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-5">
          Protecting your information on VaultArchve
        </h2>

        <p className="border-l-4 border-[#EAA800] pl-5 text-gray-800 dark:text-gray-200 text-base leading-relaxed mb-6">
          This Privacy Policy explains how VaultArchve, operated by Guagua
          Community College ("GCC", "we", "us"), collects, uses, and protects
          your information when you use the Platform.
        </p>

        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          We collect only what's needed to run the archive well — your account
          details, the theses and metadata you submit, and basic usage data
          that helps us keep the Platform reliable and secure.
        </p>
      </section>

      {/* ── What we collect ── */}
      <section>
        <p className="text-[#EAA800] text-xs font-semibold uppercase tracking-widest mb-4">
          What we collect
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: <UserCheck size={20} />,
              title: "Account info",
              desc: "Name, email, role, and course/program.",
            },
            {
              icon: <Database size={20} />,
              title: "Submitted content",
              desc: "Thesis files, titles, abstracts, and metadata.",
            },
            {
              icon: <Settings size={20} />,
              title: "Usage data",
              desc: "Pages visited, searches, and AI interactions.",
            },
            {
              icon: <Server size={20} />,
              title: "Technical data",
              desc: "IP address, browser, and device information.",
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

      {/* ── AI processing + Data sharing ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          {
            icon: <Sparkles size={22} />,
            title: "AI features & third parties",
            body: "When you use the Thesis Title Recommendation or Progressive Trail assistants, the text you enter is sent to Link third-party AI provider to generate Link response. Avoid entering personal data beyond your academic topic or course when using these features.",
          },
          {
            icon: <Share2 size={22} />,
            title: "Data sharing",
            body: "We do not sell your personal information. Approved theses may be made publicly visible as part of GCC's academic repository. We share data with service providers only to operate the Platform, and where required by law.",
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

      {/* ── Security & Your rights ── */}
      <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-8">
        <p className="text-[#EAA800] text-xs font-semibold uppercase tracking-widest mb-2">
          Good to know
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-5">
          Security, your rights & updates
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          <div>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-sm mb-2">
              <Lock size={16} className="text-[#EAA800]" />
              Storage & security
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Passwords are one-way hashed and never stored in plain text.
              Access is limited to authorized personnel.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-sm mb-2">
              <UserCheck size={16} className="text-[#EAA800]" />
              Your rights
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              You may request access to, correction of, or deletion of your
              account information, subject to academic record-keeping needs.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-sm mb-2">
              <RefreshCw size={16} className="text-[#EAA800]" />
              Policy updates
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              We may update this policy over time. Material changes are
              reflected in the "Last updated" date above.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#0f1b35] rounded-2xl px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">
          Questions about your privacy?
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
            <Link href="/terms"
            className="inline-flex items-center gap-2 border border-white/20 text-white px-6 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors">
            <ShieldCheck size={15} />
            Terms & Conditions
          </Link>
        </div>
      </section>

    </main>
  );
}