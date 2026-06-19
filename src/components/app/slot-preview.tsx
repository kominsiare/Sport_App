"use client";

import { useState } from "react";

import { SlotCell } from "@/components/marketplace/slot-cell";

const times = ["06:00", "08:00", "10:00", "16:00", "18:00", "20:00"];

export function SlotPreview() {
  const [selected, setSelected] = useState("18:00");

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {times.map((time, index) => (
        <SlotCell
          key={time}
          time={time}
          state={index === 2 ? "booked" : selected === time ? "selected" : "available"}
          onClick={() => setSelected(time)}
        />
      ))}
    </div>
  );
}
