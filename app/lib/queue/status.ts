export function normalizeQueueStatusForDb(rawStatus: unknown): string {
  const normalized = String(rawStatus ?? "").trim().toLowerCase();
  if (normalized === "no show") return "no_show";
  if (normalized === "in progress" || normalized === "in consultation" || normalized === "in_consultation") {
    return "in_consultation";
  }
  if (normalized === "done") return "completed";
  return normalized || "waiting";
}

export function buildConsultationTimestampUpdate(
  previousStatus: string | null,
  nextStatus: string,
  existingStartedAt: string | null
): {
  consultation_started_at?: string | null;
  consultation_completed_at?: string | null;
} {
  const prev = (previousStatus ?? "").trim().toLowerCase();
  const next = (nextStatus ?? "").trim().toLowerCase();
  const nowIso = new Date().toISOString();

  if (next === "in_consultation") {
    if (prev !== "in_consultation") {
      return {
        consultation_started_at: nowIso,
        consultation_completed_at: null,
      };
    }
    return {};
  }

  if (next === "completed") {
    if (prev !== "completed") {
      return {
        consultation_started_at: existingStartedAt ?? nowIso,
        consultation_completed_at: nowIso,
      };
    }
    return {};
  }

  return {};
}
