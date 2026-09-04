import type { Page, Route } from '@playwright/test';

export type Role = 'resident' | 'hoa_admin';

export type User = {
  displayName: string;
  username: string;
  email: string;
  role: Role;
  password: string;
  profileImageUrl?: string | null;
};

export type EventItem = {
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
  attendingUsers: Set<string>;
};

export type Profile = {
  displayName: string;
  username: string;
  email: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  profileImagePositionX: number;
  profileImagePositionY: number;
  profileImageZoom: number;
  bannerImageUrl?: string | null;
  bannerImagePositionX: number;
  bannerImagePositionY: number;
  bannerImageZoom: number;
  role: string;
};

export type MockApiOptions = {
  initialSession?: 'resident' | 'admin' | 'expired';
  forceLoginFailure?: boolean;
};

export type State = {
  usersByEmail: Map<string, User>;
  sessions: Map<string, User>;
  csrfToken: string;
  profilesByUsername: Map<string, Profile>;
  events: EventItem[];
};

export type ApiRouteContext = {
  route: Route;
  page: Page;
  path: string;
  method: string;
  query: URLSearchParams;
  currentUser: User | null;
  state: State;
  options: MockApiOptions;
  now: number;
};
