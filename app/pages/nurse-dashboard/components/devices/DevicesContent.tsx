import React, { useState } from "react";
import { DeviceStatusPanels } from "./DeviceStatusPanels";
import { SearchGadget } from "./SearchGadget";
import { DeviceTable, DeviceRecord } from "./DeviceTable";

const MOCK_DEVICES: DeviceRecord[] = [
  {
    id: "DEV-001",
    status: "Available",
    assignedTo: "-",
    lastUpdated: "Just now",
  },
  {
    id: "DEV-002",
    status: "In use",
    assignedTo: "Juan Dela Cruz",
    lastUpdated: "2 min ago",
  },
  {
    id: "DEV-003",
    status: "In use",
    assignedTo: "Maria Santos",
    lastUpdated: "5 min ago",
  },
  {
    id: "DEV-004",
    status: "Offline",
    assignedTo: "-",
    lastUpdated: "10 min ago",
  },
  {
    id: "DEV-005",
    status: "Available",
    assignedTo: "-",
    lastUpdated: "20 min ago",
  },
];

export function DevicesContent() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDevices = MOCK_DEVICES.filter((device) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      device.id.toLowerCase().includes(query) ||
      device.assignedTo.toLowerCase().includes(query)
    );
  });

  return (
    <section className="space-y-4">
      <header>
        <h3 className="text-base font-semibold text-[#333333] sm:text-lg">
          Connected Devices
        </h3>
        <p className="mt-1 text-xs text-[#6C757D] sm:text-sm">
          View and manage patient monitoring devices linked to this dashboard.
        </p>
      </header>

      <div>
        <DeviceStatusPanels />
        <SearchGadget value={searchTerm} onChange={setSearchTerm} />
        <DeviceTable devices={filteredDevices} />
      </div>
    </section>
  );
}

