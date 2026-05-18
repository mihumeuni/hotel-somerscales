import { useState, useEffect } from "react";
import { avatarUrl } from "../types/preferences";
import { initialsOf } from "./dashboard/avatar";

type Props = {
  userId: number | null | undefined;
  name?: string | null;
  email?: string | null;
  // Bump when avatar changes so <img> re-fetches.
  version?: number;
  className?: string;
  fallbackClassName?: string;
};

/**
 * Shows the BE-served avatar at /api/users/{id}/avatar (cached 5min by BE).
 * Falls back to initials when the image 404s (no avatar uploaded) or the
 * user id is missing.
 */
export const UserAvatar = ({
  userId,
  name,
  email,
  version = 0,
  className = "w-10 h-10 rounded-full",
  fallbackClassName = "bg-gold/20 border-2 border-gold/40 text-marine font-serif text-sm",
}: Props) => {
  const [errored, setErrored] = useState(false);

  // Reset error state whenever version (= a fresh upload) bumps.
  useEffect(() => {
    setErrored(false);
  }, [version, userId]);

  if (!userId || errored) {
    return (
      <div
        className={`${className} ${fallbackClassName} flex items-center justify-center shadow-sm`}
        aria-label={name ?? email ?? "Usuario"}
      >
        {initialsOf(name ?? email)}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl(userId, version)}
      alt={name ?? email ?? "Avatar"}
      className={`${className} object-cover shadow-sm`}
      onError={() => setErrored(true)}
    />
  );
};

export default UserAvatar;
