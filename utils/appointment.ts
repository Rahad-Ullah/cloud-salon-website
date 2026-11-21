import { AppointmentStatus } from "@/types/appointment";

/**
 * Converts AppointmentStatus enum or status string to capitalized, human-readable text.
 * e.g. "auto_cancelled" -> "Auto Cancelled", "pending" -> "Pending"
 */
export function formatAppointmentStatus(status?: AppointmentStatus | string | null): string {
  if (!status) return "Pending";

  const raw = String(status).toLowerCase().trim();

  switch (raw) {
    case AppointmentStatus.Pending:
    case "pending":
      return "Pending";
    case AppointmentStatus.Confirmed:
    case "confirmed":
      return "Confirmed";
    case AppointmentStatus.Cancelled:
    case "cancelled":
      return "Cancelled";
    case AppointmentStatus.Rejected:
    case "rejected":
      return "Rejected";
    case AppointmentStatus.AutoCancelled:
    case "auto_cancelled":
    case "autocancelled":
      return "Auto Cancelled";
    case AppointmentStatus.Active:
    case "active":
      return "Active";
    case AppointmentStatus.Completed:
    case "completed":
      return "Completed";
    default:
      // Convert underscore or dash separated words to Title Case
      return raw
        .replace(/[_-]/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }
}

/**
 * Returns consistent Tailwind badge color classes for each appointment status.
 */
export function getAppointmentStatusBadgeStyle(status?: AppointmentStatus | string | null): string {
  const raw = String(status || "").toLowerCase().trim();

  switch (raw) {
    case AppointmentStatus.Confirmed:
    case "confirmed":
    case AppointmentStatus.Completed:
    case "completed":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";

    case AppointmentStatus.Active:
    case "active":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";

    case AppointmentStatus.Cancelled:
    case "cancelled":
    case AppointmentStatus.AutoCancelled:
    case "auto_cancelled":
    case AppointmentStatus.Rejected:
    case "rejected":
      return "bg-destructive/10 text-destructive border border-destructive/20";

    case AppointmentStatus.Pending:
    case "pending":
    default:
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
  }
}
