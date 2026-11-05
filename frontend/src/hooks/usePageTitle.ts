import { useEffect } from "react";
import { profile } from "@/content/profile";

const DEFAULT_TITLE = `${profile.name} — ${profile.title}`;

/**
 * Sets document.title for the current route and restores the site title on unmount.
 * Pass null while a page's title is still loading to leave the current title alone.
 */
export function usePageTitle(title: string | null | undefined) {
  useEffect(() => {
    if (title) document.title = `${title} — ${profile.name}`;
    else if (title === undefined) document.title = DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
