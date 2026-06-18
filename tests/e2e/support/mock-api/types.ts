import type { Route } from '@playwright/test';

export type Role = 'resident' | 'hoa_admin';

export type User = {
  displayName: string;
  username: string;
  email: string;
  token: string;
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
  initialToken?: string;
  forceLoginFailure?: boolean;
};

export type State = {
  usersByToken: Map<string, User>;
  usersByEmail: Map<string, User>;
  profilesByUsername: Map<string, Profile>;
  events: EventItem[];
};

export type ApiRouteContext = {
  route: Route;
  path: string;
  method: string;
  query: URLSearchParams;
  currentUser: User | null;
  state: State;
  options: MockApiOptions;
  now: number;
};
