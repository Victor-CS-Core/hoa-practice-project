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
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="relative flex flex-col items-center border-b border-stone-200 bg-stone-50 p-8">
        {isOwner && (
          <div className="absolute right-4 top-4">
            <Button
              variant="outline"
              className="border-stone-300 bg-white text-stone-700"
              onClick={onEditClick}
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        )}

        <div className="mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-stone-200 shadow-md">
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt={profile.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-16 w-16 text-stone-400" />
          )}
        </div>

        <h1 className="font-heading text-2xl font-bold text-stone-900">
          {profile.displayName}
        </h1>
        <p className="mb-3 font-medium text-stone-500">@{profile.username}</p>

        {profile.role && profile.role !== "resident" && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            {profile.role === "hoa_admin" ? "HOA Admin" : profile.role}
          </Badge>
        )}
      </div>

      <div className="p-8">
        <h3 className="mb-3 font-heading text-lg font-semibold text-stone-900">
          About
        </h3>
        {profile.bio ? (
          <p className="whitespace-pre-line leading-relaxed text-stone-600">
            {profile.bio}
          </p>
        ) : (
          <p className="italic text-stone-400">
            This user hasn&apos;t added a bio yet.
          </p>
        )}
      </div>

      {isOwner && (
        <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 p-6 text-sm">
          <span className="text-stone-500">
            This is how your profile appears to the community.
          </span>
          <Button
            variant="ghost"
            className="text-stone-500 hover:text-stone-900"
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
