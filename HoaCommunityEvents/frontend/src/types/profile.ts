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

export type UpdateProfileValues = {
  displayName: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  profileImagePositionX?: number | null;
  profileImagePositionY?: number | null;
  profileImageZoom?: number | null;
  bannerImageUrl?: string | null;
  bannerImagePositionX?: number | null;
  bannerImagePositionY?: number | null;
  bannerImageZoom?: number | null;
};
