"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Avatar display matching the navbar style: blue gradient circle with initial when no image.
 * When avatar_url is set, shows the uploaded image; otherwise the same icon as navbar.
 */
type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "w-9 h-9",
  md: "w-10 h-10",
  lg: "w-24 h-24",
};

const textSizeClasses: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-3xl",
};

export function ProfileAvatar({
  avatarUrl,
  firstName,
  lastName,
  size = "md",
  className = "",
  imageKey,
}: {
  avatarUrl?: string | null;
  firstName: string;
  lastName?: string;
  size?: Size;
  className?: string;
  /** Pass a value that changes when the image is updated (e.g. Date.now() on save) so the browser loads the new image instead of cache when the URL is the same. */
  imageKey?: number | string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  // Per-mount version so same URL still gets a fresh load after navigation/login (avoids stale cached image)
  const mountVersionRef = useRef<number>(Date.now());

  // Reset failed state when the URL or imageKey changes so a new image can load
  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl, imageKey]);

  const initial = (firstName?.charAt(0) || "?").toUpperCase();
  const sizeClass = sizeClasses[size];
  const showImage = avatarUrl && !imgFailed;
  const isHttp = typeof avatarUrl === "string" && /^https?:\/\//i.test(avatarUrl);
  // Always cache-bust HTTP(S) URLs: use imageKey when provided, else per-mount version so re-login/navigation loads fresh
  const version = imageKey != null && imageKey !== "" ? imageKey : mountVersionRef.current;
  const src = showImage && avatarUrl
    ? isHttp
      ? `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}v=${version}`
      : avatarUrl
    : "";

  return (
    <div className={`relative rounded-full overflow-hidden ${sizeClass} ${className}`}>
      {showImage ? (
        <img
          key={`${avatarUrl ?? ""}-${version}`}
          src={src}
          alt="Profile"
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm ${textSizeClasses[size]}`}>
          {initial}
        </div>
      )}
    </div>
  );
}
