function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function UsersTwoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

const quickHelpItems = [
  { title: "Emergency Hotline", description: "Call 911 or (02) 8911-1111", icon: PhoneIcon },
  { title: "FAQs", description: "Common questions and answers", icon: QuestionIcon },
  { title: "Forms & Documents", description: "Download patient forms", icon: DocumentIcon },
  { title: "Patient Support", description: "Get help with your visit", icon: UsersTwoIcon },
];

export function QuickHelp() {
  return (
    <section className="border-t border-[#E9ECEF] bg-white py-12 sm:py-16" aria-labelledby="quick-help-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 id="quick-help-heading" className="text-2xl font-bold text-[#333333] sm:text-3xl">Quick Help</h2>
        <p className="mt-1 text-[#6C757D]">Frequently accessed information</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickHelpItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <article key={i} className="flex flex-col items-center rounded-xl border border-[#E9ECEF] bg-white p-4 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E0F7FA] text-[#1877F2]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-2 font-semibold text-[#333333]">{item.title}</h3>
                <p className="mt-1 text-sm text-[#6C757D]">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
