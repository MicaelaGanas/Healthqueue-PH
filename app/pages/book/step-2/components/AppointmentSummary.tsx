import React from "react";

type Summary = {
  department: string;
  date: string;
  time: string;
  preferredDoctor?: string;
};

type Props = {
  summary: Summary;
};

export function AppointmentSummary({ summary }: Props) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-[#333333]">Appointment Summary</h3>
      <ul className="mt-3 space-y-1 text-[#333333]">
        <li><span className="font-bold">Department:</span> <span className="font-normal">{summary.department}</span></li>
        <li><span className="font-bold">Date:</span> <span className="font-normal">{summary.date}</span></li>
        <li><span className="font-bold">Time:</span> <span className="font-normal">{summary.time}</span></li>
        {summary.preferredDoctor && summary.preferredDoctor !== "—" && (
          <li><span className="font-bold">Preferred Doctor:</span> <span className="font-normal">{summary.preferredDoctor}</span></li>
        )}
      </ul>
    </div>
  );
}
