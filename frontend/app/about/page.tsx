import React from "react";
import {
  BookOpen,
  Laptop,
  Search,
  Archive,
  Users,
  Download,
  Upload,
  Sparkles,
  History,
  Target,
  Library,
} from "lucide-react";

export default function AboutPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">

      {/* ── Hero ── */}
      <section className="relative bg-[#0f1b35] rounded-2xl px-10 py-16 text-center overflow-hidden">
        <span className="inline-flex items-center gap-2 text-[#EAA800] text-sm border border-[#EAA800]/30 bg-[#EAA800]/10 px-4 py-1.5 rounded-full mb-5">
          <Library size={14} />
          Guagua Community College
        </span>
        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
          About <span className="text-[#EAA800]">VaultArchve</span>
        </h1>
        <p className="text-white/55 max-w-xl mx-auto text-sm leading-relaxed">
          The official digital thesis repository of Guagua Community College —
          built to preserve, discover, and celebrate academic excellence.
        </p>
      </section>

      {/* ── Mission ── */}
      <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-8">
        <p className="text-[#EAA800] text-xs font-semibold uppercase tracking-widest mb-2">
          Our mission
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-5">
          Bringing thesis access into the digital age
        </h2>

        {/* Pull quote */}
        <p className="border-l-4 border-[#EAA800] pl-5 text-gray-800 dark:text-gray-200 text-base leading-relaxed mb-6">
          VaultArchve was developed to help students access their thesis and
          academic research easily — anytime, anywhere — through a modern
          digital platform.
        </p>

        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">
          Before VaultArchve, finding a thesis at Guagua Community College meant
          physically visiting the library, searching through binders, or relying
          on word of mouth. Students had no reliable way to discover relevant
          research from their peers or predecessors — valuable academic work was
          effectively invisible to the people who needed it most.
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">
          VaultArchve changes that. By digitizing and centralizing the college's
          academic output, we give every GCC student, faculty member, and
          researcher a trusted digital space where academic work is preserved,
          searchable, and easy to access — removing the barriers that once made
          thesis research unnecessarily difficult.
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          Whether you are a first-year student looking for reference material, a
          graduating student submitting your own research, or a faculty member
          tracking academic output — VaultArchve is built for you.
        </p>

        {/* Mission pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {[
            {
              icon: <Laptop size={20} />,
              title: "Digital access",
              desc: "Access any thesis from any device, no library visit required.",
            },
            {
              icon: <Search size={20} />,
              title: "Easy search",
              desc: "Find research by title, author, course, or keyword instantly.",
            },
            {
              icon: <Archive size={20} />,
              title: "Permanent archive",
              desc: "Every submission is safely stored and never lost.",
            },
            {
              icon: <Users size={20} />,
              title: "Open to all",
              desc: "Free access for the entire GCC academic community.",
            },
          ].map((p) => (
            <div
              key={p.title}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center"
            >
              <div className="text-[#EAA800] flex justify-center mb-2">{p.icon}</div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {p.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── History + Vision ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          {
            icon: <History size={22} />,
            title: "Our history",
            body: "VaultArchve started as a capstone project at GCC with one goal: replace the outdated manual process of finding theses with a fast, reliable digital system that actually works for students. What began as a student initiative has grown into the college's primary academic archive.",
          },
          {
            icon: <Target size={22} />,
            title: "Our vision",
            body: "To become the most complete and accessible academic repository in the region — where no GCC research is ever lost, and every student can stand on the shoulders of those who came before them. We want every thesis to matter beyond graduation day.",
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

      {/* ── Features ── */}
      <section>
        <p className="text-[#EAA800] text-xs font-semibold uppercase tracking-widest mb-4">
          What you can do on VaultArchve
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: <BookOpen size={20} />,
              title: "Browse theses",
              desc: "Explore the full archive across all departments and academic years.",
            },
            {
              icon: <Sparkles size={20} />,
              title: "AI recommendations",
              desc: "Get smart thesis suggestions tailored to your field of study.",
            },
            {
              icon: <Download size={20} />,
              title: "Download papers",
              desc: "Save thesis documents for offline reading anytime.",
            },
            {
              icon: <Upload size={20} />,
              title: "Submit your thesis",
              desc: "Contribute your work to the growing GCC digital archive.",
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

      {/* ── CTA ── */}
      <section className="bg-[#0f1b35] rounded-2xl px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">
          Start exploring the archive
        </h2>
        <p className="text-white/50 text-sm mb-8 max-w-md mx-auto leading-relaxed">
          Everything your academic research needs — in one digital place, built
          by GCC students, for GCC students.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href="/browse"
            className="inline-flex items-center gap-2 bg-[#EAA800] text-[#2a1a00] font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-yellow-400 transition-colors"
          >
            <Search size={15} />
            Browse thesis
          </a>
          <a
            href="/ai-recommendation"
            className="inline-flex items-center gap-2 border border-white/20 text-white px-6 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors"
          >
            <Sparkles size={15} />
            AI recommendation
          </a>
        </div>
      </section>

    </main>
  );
}