import { AtSign, Edit3, Mail, ShieldCheck, User } from "lucide-react";
import { FramedImage } from "../../../components/media/FramedImage";
import { Badge } from "../../../components/design-system/ui/badge";
import { Button } from "../../../components/design-system/ui/button";
import type { Profile } from "../../../types/profile";
import { BRAND } from "../../../app/branding";

interface ProfileOverviewProps {
  profile: Profile;
  isOwner: boolean;
  onEditClick: () => void;
}

export function ProfileOverview({
  profile,
  isOwner,
  onEditClick,
}: ProfileOverviewProps) {
  const roleLabel =
    profile.role === "hoa_admin" ? BRAND.adminLabel : "Resident";

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-hairline bg-page shadow-sm animate-fade-up">
      <div
        className={[
          "relative overflow-hidden border-b border-hairline px-6 pb-8 pt-6 sm:px-8",
          profile.bannerImageUrl
            ? "profile-hero-gradient-soft"
            : "profile-hero-gradient",
        ].join(" ")}
      >
        {profile.bannerImageUrl && (
          <div className="absolute inset-0">
            <FramedImage
              src={profile.bannerImageUrl}
              alt={`${profile.displayName} banner`}
              positionX={profile.bannerImagePositionX}
              positionY={profile.bannerImagePositionY}
              zoom={profile.bannerImageZoom}
            />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-black/25" />
        <div className="profile-hero-glow pointer-events-none absolute inset-0" />

        {isOwner && (
          <div className="absolute right-4 top-4 z-10">
            <Button
              variant="secondary"
              className="border-white/40 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
              onClick={onEditClick}
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        )}

        <div className="relative z-10 mt-8 flex flex-col items-center text-center sm:items-start sm:text-left">
          <div className="mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/60 bg-white/90 shadow-lg">
            {profile.profileImageUrl ? (
              <FramedImage
                src={profile.profileImageUrl}
                alt={profile.displayName}
                positionX={profile.profileImagePositionX}
                positionY={profile.profileImagePositionY}
                zoom={profile.profileImageZoom}
              />
            ) : (
              <User className="h-14 w-14 text-accent-display" />
            )}
          </div>

          <h1 className="font-heading text-3xl font-bold text-white">
            {profile.displayName}
          </h1>
          <p className="mt-1 text-sm font-medium text-accent-ink">
            @{profile.username}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="solid" className="bg-[#ffffff] text-[#245f47]">
              {roleLabel}
            </Badge>
            {isOwner && (
              <Badge
                tone="neutral"
                className="border-white/55 bg-white/15 text-white"
              >
                Your profile
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-hairline bg-surface p-5">
          <h3 className="mb-3 font-heading text-lg font-semibold text-ink-display">
            About
          </h3>
          {profile.bio ? (
            <p className="whitespace-pre-line leading-relaxed text-ink-muted">
              {profile.bio}
            </p>
          ) : (
            <p className="italic text-ink-muted">
              This user hasn&apos;t added a bio yet.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-hairline bg-surface p-5">
          <h3 className="mb-3 font-heading text-lg font-semibold text-ink-display">
            Profile Details
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2 text-ink-muted">
              <AtSign className="h-4 w-4" />
              <span className="truncate">{profile.username}</span>
            </li>
            <li className="flex items-center gap-2 text-ink-muted">
              <Mail className="h-4 w-4" />
              <span className="truncate">{profile.email}</span>
            </li>
            <li className="flex items-center gap-2 text-ink-muted">
              <ShieldCheck className="h-4 w-4" />
              <span>{roleLabel}</span>
            </li>
          </ul>
        </div>
      </div>

      {isOwner && (
        <div className="border-t border-hairline bg-surface p-6 text-sm text-ink-muted">
          This is how your profile appears to the community.
        </div>
      )}
    </div>
  );
}
