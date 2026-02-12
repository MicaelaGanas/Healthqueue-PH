export type QueueStatusStep = "waiting" | "almost" | "proceed";

const steps: { key: QueueStatusStep; label: string; color: string; bgColor: string }[] = [
  { key: "waiting", label: "WAITING", color: "#EF5350", bgColor: "bg-[#EF5350]" },
  { key: "almost", label: "ALMOST YOUR TURN", color: "#FFC107", bgColor: "bg-[#FFC107]" },
  { key: "proceed", label: "PROCEED NOW", color: "#4CAF50", bgColor: "bg-[#4CAF50]" },
];

type Props = {
  currentStep?: QueueStatusStep;
};

export function QueueStatusProgress({ currentStep = "waiting" }: Props) {
  const currentIndex = Math.max(0, steps.findIndex((s) => s.key === currentStep));
  const indicatorPosition = (currentIndex + 0.5) * (100 / steps.length);

  return (
    <section
      className="mt-8 rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm"
      aria-labelledby="queue-status-heading"
    >
      <h2 id="queue-status-heading" className="text-lg font-bold text-[#333333]">
        Queue Status
      </h2>

      {/* Wrapper for bar + indicator so layout is clear */}
      <div className="relative mt-6 w-full">
        {/* YOU ARE HERE indicator above the bar */}
        <div
          className="absolute z-10 flex flex-col items-center"
          style={{
            left: `${indicatorPosition}%`,
            top: 0,
            transform: "translate(-50%, -100%)",
            marginTop: "-8px",
          }}
        >
          <span className="whitespace-nowrap text-xs font-medium text-[#333333]">YOU ARE HERE</span>
          <svg
            className="mt-1 h-4 w-4 text-[#333333]"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M12 4l-8 8h5v8h6v-8h5l-8-8z" />
          </svg>
        </div>

        {/* Progress bar: three segments */}
        <div className="flex h-10 w-full overflow-hidden rounded-lg">
          {steps.map((step) => (
            <div
              key={step.key}
              className="flex-1"
              style={{ minWidth: 0, backgroundColor: step.color }}
              title={step.label}
            />
          ))}
        </div>
      </div>

      {/* Labels under bar */}
      <div className="mt-3 flex justify-between text-xs font-medium text-[#6C757D]">
        {steps.map((step) => (
          <span key={step.key}>{step.label}</span>
        ))}
      </div>
    </section>
  );
}
