export type HoaEvent = {
  id: string;
  title: string;
  description: string;
  category: string;
  locationWithinCommunity: string;
  startDate: string;
  endDate: string;
  maxAttendees?: number | null;
  imageUrl?: string | null;
  hostUserId: string;
  hostDisplayName: string;
  status: string;
  attendeeCount: number;
  isCurrentUserAttending: boolean;
};

export type EventFilter = {
  category?: string;
  status?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CreateEventFormValues = {
  title: string;
  description: string;
  category: string;
  locationWithinCommunity: string;
  startDate: string;
  endDate: string;
  maxAttendees?: number | null;
  imageUrl?: string | null;
};

export type EditEventFormValues = CreateEventFormValues;
