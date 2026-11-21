export type PartStatus =
  | "not_configured" | "ready_for_review" | "generating" | "generation_failed"
  | "generated" | "validated" | "needs_revision";

export type Verification =
  | "verified" | "derived" | "inferred" | "unknown" | "user_override" | "template_default";

export interface Param {
  name: string;
  value: number | string | number[];
  unit: string;
  verification: Verification;
  locked?: boolean;
  source?: { drawing?: string; entity_handle?: string; note?: string };
}

export interface Part {
  id: string;
  type: string;
  instance?: number;
  template: { id: string; version: string };
  status: PartStatus;
  parameters: Param[];
}

export interface Project {
  schema_version: string;
  project_id: string;
  units: "mm";
  source_drawings?: string[];
  base: { body_file: string; floor_file: string };
  parts: Part[];
  assembly?: { status: string; mates: unknown[] };
}
