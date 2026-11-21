import type { Part, Project } from "./types";

// box = placeholder preview size in metres (NOT real geometry)
export const PART_TYPES: { type: string; label: string; box: [number, number, number] }[] = [
  { type: "single_door", label: "Single Door", box: [1, 2, 0.05] },
  { type: "double_door", label: "Double Door", box: [2, 2, 0.05] },
  { type: "ladder", label: "Ladder", box: [0.5, 2.5, 0.1] },
  { type: "fixed_louvers", label: "Fixed Louvers", box: [1, 2, 0.08] },
  { type: "cable_entry", label: "Cable Entry", box: [0.6, 0.4, 0.05] },
  { type: "drain_access", label: "Drain Access", box: [0.4, 0.4, 0.2] },
  { type: "floor_water_drains", label: "Floor Water Drains", box: [3, 0.05, 0.3] },
  { type: "door_alarm", label: "Door Alarm", box: [0.2, 0.2, 0.1] },
  { type: "sand_trap", label: "Sand Trap", box: [0.8, 0.3, 0.5] },
  { type: "motorized_louver", label: "Motorized Louver", box: [1, 1, 0.1] },
];

export function emptyProject(): Project {
  const parts: Part[] = PART_TYPES.map((t, i) => ({
    id: `P${String(i + 1).padStart(2, "0")}`,
    type: t.type,
    instance: 1,
    template: { id: t.type, version: "unmade" },
    status: "not_configured",
    parameters: [],
  }));
  return {
    schema_version: "0.1.0", project_id: "new_project", units: "mm",
    base: { body_file: "", floor_file: "" }, parts, assembly: { status: "not_built", mates: [] },
  };
}
