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
  imagePositionX: number;
  imagePositionY: number;
  imageZoom: number;
  hostUserId: string;
  hostDisplayName: string;
  status: string;
  attendeeCount: number;
  isCurrentUserAttending: boolean;
};

export type EventFilter = {
  category?: string;
  status?: string;
  includePending?: boolean;
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
  imagePositionX?: number | null;
  imagePositionY?: number | null;
  imageZoom?: number | null;
};

export type EditEventFormValues = CreateEventFormValues;
