export type QueueInfo = {
  queueNumber: string;
  assignedDepartment: string;
  estimatedWaitTime: string;
};

const cardLabelClass = "text-xs font-bold uppercase tracking-wide text-[#6C757D]";
const cardValueClass = "mt-1 text-2xl font-bold text-black sm:text-3xl";

export function QueueInfoCards({ queueNumber, assignedDepartment, estimatedWaitTime }: QueueInfo) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm">
        <p className={cardLabelClass}>Queue Number</p>
        <p className={cardValueClass}>{queueNumber}</p>
      </div>
      <div className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm">
        <p className={cardLabelClass}>Assigned Department</p>
        <p className={`${cardValueClass} uppercase`}>{assignedDepartment}</p>
      </div>
      <div className="rounded-xl border border-[#e9ecef] bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
        <p className={cardLabelClass}>Estimate Waiting Time</p>
        <p className={cardValueClass}>
          <span className="text-2xl font-bold sm:text-3xl">{estimatedWaitTime}</span>
        </p>
      </div>
    </div>
  );
}
