/**
 * Assignment History Constants
 * Shared configuration for Program and CustomProgram assignment history pages
 */

export const ASSIGNMENT_STATUS_FILTERS = ["All", "Success", "Failed", "Pending", "Retrying"];

export const STATUS_BADGE_CONFIG = {
  variants: {
    success: "default" as const,
    failed: "destructive" as const,
    pending: "secondary" as const,
    retrying: "outline" as const,
  },
  colors: {
    success: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
    retrying: "bg-blue-100 text-blue-800",
  },
};
