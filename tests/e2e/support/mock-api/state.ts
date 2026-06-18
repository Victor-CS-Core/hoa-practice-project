import type { EventItem, Profile, State, User } from './types';

function eventDates(now: number, startOffsetDays: number, durationHours: number) {
  const start = new Date(now + startOffsetDays * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export function buildInitialState(now: number): State {
  const resident: User = {
    displayName: 'Casey Resident',
    username: 'casey',
    email: 'casey@example.com',
    token: 'token-resident',
    role: 'resident',
    password: 'Password123!',
    profileImageUrl: null,
  };

  const admin: User = {
    displayName: 'Alex Admin',
    username: 'alexadmin',
    email: 'alexadmin@example.com',
    token: 'token-admin',
    role: 'hoa_admin',
    password: 'Password123!',
    profileImageUrl: null,
  };

  const usersByToken = new Map<string, User>([
    [resident.token, resident],
    [admin.token, admin],
  ]);

  const usersByEmail = new Map<string, User>([
    [resident.email.toLowerCase(), resident],
    [admin.email.toLowerCase(), admin],
  ]);

  const profilesByUsername = new Map<string, Profile>([
    [
      resident.username,
      {
        displayName: resident.displayName,
        username: resident.username,
        email: resident.email,
        bio: 'Resident profile bio',
        profileImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg',
        profileImagePositionX: 50,
        profileImagePositionY: 50,
        profileImageZoom: 1,
        bannerImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/banner.jpg',
        bannerImagePositionX: 50,
        bannerImagePositionY: 50,
        bannerImageZoom: 1,
        role: resident.role,
      },
    ],
    [
      admin.username,
      {
        displayName: admin.displayName,
        username: admin.username,
        email: admin.email,
        bio: 'Admin profile bio',
        profileImageUrl: null,
        profileImagePositionX: 50,
        profileImagePositionY: 50,
        profileImageZoom: 1,
        bannerImageUrl: null,
        bannerImagePositionX: 50,
        bannerImagePositionY: 50,
        bannerImageZoom: 1,
        role: admin.role,
      },
    ],
  ]);

  const eventOneDates = eventDates(now, 2, 2);
  const eventTwoDates = eventDates(now, 6, 3);
  const eventThreeDates = eventDates(now, 10, 2);

  const events: EventItem[] = [
    {
      id: 'event-1',
      title: 'Pool Safety Workshop',
      description: 'Community workshop for summer safety.',
      category: 'Pool Event',
      locationWithinCommunity: 'Pool Deck',
      startDate: eventOneDates.startDate,
      endDate: eventOneDates.endDate,
      maxAttendees: 25,
      imageUrl: null,
      imagePositionX: 50,
      imagePositionY: 50,
      imageZoom: 1,
      hostUserId: 'admin-1',
      hostDisplayName: admin.displayName,
      status: 'Published',
      attendeeCount: 1,
      attendingUsers: new Set([resident.username]),
    },
    {
      id: 'event-2',
      title: 'Board Budget Review',
      description: 'Quarterly board budget review meeting.',
      category: 'Board Meeting',
      locationWithinCommunity: 'Clubhouse Room A',
      startDate: eventTwoDates.startDate,
      endDate: eventTwoDates.endDate,
      maxAttendees: 40,
      imageUrl: null,
      imagePositionX: 50,
      imagePositionY: 50,
      imageZoom: 1,
      hostUserId: 'admin-1',
      hostDisplayName: admin.displayName,
      status: 'Pending',
      attendeeCount: 0,
      attendingUsers: new Set<string>(),
    },
    {
      id: 'event-3',
      title: 'Neighborhood Cleanup Day',
      description: 'Bring gloves and join cleanup teams.',
      category: 'Community Cleanup',
      locationWithinCommunity: 'Main Entrance',
      startDate: eventThreeDates.startDate,
      endDate: eventThreeDates.endDate,
      maxAttendees: 100,
      imageUrl: null,
      imagePositionX: 50,
      imagePositionY: 50,
      imageZoom: 1,
      hostUserId: 'admin-1',
      hostDisplayName: admin.displayName,
      status: 'Published',
      attendeeCount: 0,
      attendingUsers: new Set<string>(),
    },
  ];

  return { usersByToken, usersByEmail, profilesByUsername, events };
}
