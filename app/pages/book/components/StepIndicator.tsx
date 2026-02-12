function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const steps = [
  { number: 1, label: "Select Date" },
  { number: 2, label: "Your Details" },
  { number: 3, label: "Confirmation" },
];

type Props = {
  currentStep?: number;
};

export function StepIndicator({ currentStep = 1 }: Props) {
  return (
    <nav className="mt-6" aria-label="Booking progress">
      <div className="flex items-center justify-center gap-0">
        {steps.map((step, i) => {
          const isActive = step.number === currentStep;
          const isPast = step.number < currentStep;
          const isLast = i === steps.length - 1;
          return (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                    isActive
                      ? "border-[#007bff] bg-[#007bff] text-white"
                      : isPast
                        ? "border-[#007bff] bg-[#007bff] text-white"
                        : "border-[#dee2e6] bg-white text-[#6C757D]"
                  }`}
                >
                  {isPast ? <CheckIcon className="h-5 w-5" /> : step.number}
                </span>
                <span
                  className={`mt-2 text-xs font-medium sm:text-sm ${
                    isActive || isPast ? "text-[#007bff]" : "text-[#6C757D]"
                  }`}
                >
                  {step.number} {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`mx-2 h-0.5 w-8 sm:w-12 ${i + 1 < currentStep ? "bg-[#007bff]" : "bg-[#dee2e6]"}`}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
