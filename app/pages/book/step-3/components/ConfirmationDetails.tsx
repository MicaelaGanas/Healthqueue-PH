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

const rowClass = "flex gap-4 py-2.5 first:pt-0";
const labelClass = "shrink-0 w-36 font-medium text-[#333333]";
const valueClass = "text-[#333333] min-w-0";

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
  return (
    <div className="mx-auto mt-8 max-w-lg space-y-0 rounded-lg border border-[#e9ecef] bg-[#f8f9fa] p-4 text-[#333333]">
      <div className={rowClass}>
        <span className={labelClass}>Reference No.</span>
        <span className="rounded bg-[#e7f1ff] px-2 py-1 font-bold text-[#007bff]">{referenceNo}</span>
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Name</span>
        <span className={valueClass}>{name}</span>
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Phone Number</span>
        <span className={valueClass}>{phone}</span>
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Email</span>
        <span className={valueClass}>{email || "—"}</span>
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Department</span>
        <span className={valueClass}>{department}</span>
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Date</span>
        <span className={valueClass}>{date}</span>
      </div>
      <div className={rowClass}>
        <span className={labelClass}>Time</span>
        <span className={valueClass}>{time}</span>
      </div>
      {preferredDoctor && preferredDoctor !== "—" && (
        <div className={rowClass}>
          <span className={labelClass}>Preferred Doctor</span>
          <span className={valueClass}>{preferredDoctor}</span>
        </div>
      )}
    </div>
  );
}
