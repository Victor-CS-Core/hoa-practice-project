export const EVENT_CATEGORY_FILTER_OPTIONS = [
  "Board Meeting",
  "Community Cleanup",
  "Pool Event",
] as const;

export const EVENT_STATUS_FILTER_OPTIONS = [
  "Published",
  "Ended",
  "Cancelled",
] as const;

export const ADMIN_EVENT_STATUS_FILTER_OPTIONS = [
  "Pending",
  ...EVENT_STATUS_FILTER_OPTIONS,
] as const;
