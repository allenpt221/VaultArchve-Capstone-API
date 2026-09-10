import { FileText, ShieldCheck, Users, Sparkles, Ban, RefreshCw, AlertTriangle, Mail } from "lucide-react";

const sections = [
  {
    icon: ShieldCheck,
    title: "1. Acceptance of Terms",
    body: (
      <p>
        By accessing or using VaultArchve ("the Platform"), operated by Guagua Community College
        ("GCC", "we", "us"), you agree to be bound by these Terms & Conditions. If you do not
        agree, please do not use the Platform.
      </p>
    ),
  },
  {
    icon: Users,
    title: "2. Who Can Use VaultArchve",
    body: (
      <p>
        The Platform is intended for GCC students, faculty, staff, and researchers. Some features —
        such as browsing and reading published theses — may be available to the public, while
        submission, review, and administrative features are restricted to authorized accounts.
      </p>
    ),
  },
  {
    icon: FileText,
    title: "3. Account Responsibilities",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
        <li>You agree to provide accurate information when registering an account.</li>
        <li>You are responsible for all activity that occurs under your account.</li>
      </ul>
    ),
  },
  {
    icon: FileText,
    title: "4. Thesis Submissions & Intellectual Property",
    body: (
      <p>
        Theses uploaded to VaultArchve remain the intellectual property of their respective authors.
        By submitting a thesis, you grant GCC a non-exclusive, royalty-free license to store, index,
        display, and make the work available for academic and research purposes through the Platform.
        You confirm that you have the right to submit the work and that it does not infringe on any
        third party's rights.
      </p>
    ),
  },
  {
    icon: Sparkles,
    title: "5. AI-Assisted Features",
    body: (
      <p>
        The Platform includes AI-generated features such as thesis title recommendations and
        the Progressive Trail guidance tool. These outputs are suggestions only, may contain
        inaccuracies, and should be verified with your adviser or faculty before being relied upon
        academically.
      </p>
    ),
  },
  {
    icon: Ban,
    title: "6. Acceptable Use",
    body: (
      <>
        <p className="mb-2">You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Upload content that is plagiarized, unlawful, or infringes on others' rights.</li>
          <li>Attempt to gain unauthorized access to other accounts or restricted areas of the Platform.</li>
          <li>Use automated tools to scrape or bulk-download content without permission.</li>
          <li>Misuse the AI features to generate harmful, abusive, or unrelated content.</li>
        </ul>
      </>
    ),
  },
  {
    icon: RefreshCw,
    title: "7. Availability & Changes",
    body: (
      <p>
        We may modify, suspend, or discontinue any part of the Platform at any time. We may also
        update these Terms periodically; continued use of the Platform after changes constitutes
        acceptance of the revised Terms.
      </p>
    ),
  },
  {
    icon: AlertTriangle,
    title: "8. Limitation of Liability",
    body: (
      <p>
        VaultArchve is provided "as is." GCC is not liable for any indirect, incidental, or
        consequential damages arising from your use of the Platform, including reliance on
        AI-generated suggestions.
      </p>
    ),
  },
  {
    icon: Mail,
    title: "9. Contact",
    body: (
      <p>
        Questions about these Terms can be directed to{" "}
        <a href="mailto:library@gcc.edu.ph" className="text-amber-600 hover:underline font-medium">
          library@gcc.edu.ph
        </a>.
      </p>
    ),
  },
];

function TermsPage() {
  return (
    <div className="w-full bg-background font-body">
      {/* Hero — matches homepage banner styling */}
      <div className="relative bg-[#0b1f3d] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1f3d]/95 via-[#0b1f3d]/90 to-[#0b1f3d]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-semibold px-4 py-1.5 mb-6">
            <FileText className="h-3.5 w-3.5" />
            Legal
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Terms & <span className="text-amber-400">Conditions</span>
          </h1>
          <p className="text-primary-foreground/70 text-sm sm:text-base max-w-xl mx-auto">
            Please read these terms carefully before using VaultArchve, the official digital thesis
            repository of Guagua Community College.
          </p>
          {/* <p className="text-primary-foreground/40 text-xs mt-4">
            Last updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p> */}
        </div>
      </div>

      {/* Content cards */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-20 relative">
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-7"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-full bg-amber-400/15 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-amber-600" />
                  </div>
                  <h2 className="font-display text-base sm:text-lg font-semibold text-foreground">
                    {section.title}
                  </h2>
                </div>
                <div className="text-sm leading-relaxed text-muted-foreground pl-12">
                  {section.body}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TermsPage;