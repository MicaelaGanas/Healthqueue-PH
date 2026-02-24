import React from "react";

type Props = {
  referenceNo: string;
  name: string;
  phone: string;
  email: string;
  department: string;
  date: string;
  time: string;
  preferredDoctor?: string;
};

const rows: { key: keyof Props; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "department", label: "Department" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "preferredDoctor", label: "Preferred doctor" },
];

export function ConfirmationDetails({
  referenceNo,
  name,
  phone,
  email,
  department,
  date,
  time,
  preferredDoctor,
}: Props) {
  const values: Record<string, string> = {
    name,
    phone,
    email: email || "—",
    department: department || "—",
    date: date || "—",
    time: time || "—",
    preferredDoctor: preferredDoctor || "—",
  };

  const rowClass =
    "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-slate-100 py-3 last:border-0";

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <dl className="flex flex-1 flex-col gap-0">
        <div className={rowClass}>
          <dt className="text-sm font-medium text-slate-500">Reference</dt>
          <dd className="min-w-0 text-right">
            <span className="inline-block rounded-lg bg-blue-600 px-3 py-1.5 font-mono text-sm font-semibold tracking-wide text-white shadow-sm">
              {referenceNo || "—"}
            </span>
          </dd>
        </div>
        {rows
          .filter((r) => r.key !== "preferredDoctor" || (values.preferredDoctor && values.preferredDoctor !== "—"))
          .map(({ key, label }) => (
            <div key={key} className={rowClass}>
              <dt className="text-sm font-medium text-slate-500">{label}</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-800">
                {values[key] ?? "—"}
              </dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
