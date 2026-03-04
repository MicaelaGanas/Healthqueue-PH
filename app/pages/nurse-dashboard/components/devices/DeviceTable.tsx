import React from "react";

export type DeviceRecord = {
  id: string;
  status: "Available" | "In use" | "Offline";
  assignedTo: string;
  lastUpdated: string;
};

type DeviceTableProps = {
  devices: DeviceRecord[];
};

export function DeviceTable({ devices }: DeviceTableProps) {
  return (
    <div className="overflow-x-auto mt-5 rounded-lg border border-[#dee2e6]">
      <table className="w-full bg-white text-sm text-[#333333]">
        <thead className="bg-[#f8f9fa]">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Device ID</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Assigned To</th>
            <th className="px-4 py-3 text-left font-medium">Last Updated</th>
            <th className="px-4 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {devices.length === 0 ? (
            <tr>
              <td
                className="px-4 py-4 text-center text-[#6C757D]"
                colSpan={5}
              >
                No devices match your search.
              </td>
            </tr>
          ) : (
            devices.map((device) => (
              <tr
                key={device.id}
                className="border-t border-[#dee2e6] hover:bg-[#f8f9fa]"
              >
                <td className="px-4 py-3 font-medium">{device.id}</td>
                <td className="px-4 py-3">{device.status}</td>
                <td className="px-4 py-3">{device.assignedTo}</td>
                <td className="px-4 py-3">{device.lastUpdated}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className=" bg-gray-400 text-white p-2 rounded-md text-sm font-medium hover:bg-gray-500 transition-colors duration-200"
                  >
                    unassign
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}