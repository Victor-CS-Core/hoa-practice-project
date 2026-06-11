export type Profile = {
  displayName: string;
  username: string;
  email: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  bannerImageUrl?: string | null;
  role: string;
};

export type UpdateProfileValues = {
  displayName: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  bannerImageUrl?: string | null;
};
