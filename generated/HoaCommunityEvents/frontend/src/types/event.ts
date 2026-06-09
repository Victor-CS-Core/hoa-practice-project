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
