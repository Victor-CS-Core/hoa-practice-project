import { Edit3, Settings, User } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import type { Profile } from "../../../types/profile";

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
  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border theme-border-surface theme-bg-surface shadow-sm">
      <div className="relative flex flex-col items-center border-b theme-border-surface theme-bg-surface-muted p-8">
        {isOwner && (
          <div className="absolute right-4 top-4">
            <Button
              variant="outline"
              className="theme-border-surface theme-bg-surface theme-text-muted"
              onClick={onEditClick}
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        )}

        <div className="mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 theme-border-base theme-bg-surface-muted shadow-md">
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt={profile.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-16 w-16 theme-text-muted" />
          )}
        </div>

        <h1 className="font-heading text-2xl font-bold theme-text-primary">
          {profile.displayName}
        </h1>
        <p className="mb-3 font-medium theme-text-muted">@{profile.username}</p>

        {profile.role && profile.role !== "resident" && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            {profile.role === "hoa_admin" ? "HOA Admin" : profile.role}
          </Badge>
        )}
      </div>

      <div className="p-8">
        <h3 className="mb-3 font-heading text-lg font-semibold theme-text-primary">
          About
        </h3>
        {profile.bio ? (
          <p className="whitespace-pre-line leading-relaxed theme-text-muted">
            {profile.bio}
          </p>
        ) : (
          <p className="italic theme-text-muted">
            This user hasn&apos;t added a bio yet.
          </p>
        )}
      </div>

      {isOwner && (
        <div className="flex items-center justify-between border-t theme-border-surface theme-bg-surface-muted p-6 text-sm">
          <span className="theme-text-muted">
            This is how your profile appears to the community.
          </span>
          <Button
            variant="ghost"
            className="theme-text-muted theme-hover-text-primary"
            disabled
          >
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </Button>
        </div>
      )}
    </div>
  );
}
