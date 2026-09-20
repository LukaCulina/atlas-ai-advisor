import { useEffect, useState } from "react";

export const MOBILE_QUERY = "(max-width: 700px)";

export function useMediaQuery(query: string): boolean {
  const [state, setState] = useState(() => ({ query, matches: window.matchMedia(query).matches }));

  // Re-derive synchronously during render if `query` changed since the last
  // render, instead of syncing it via a setState call in the effect body.
  if (state.query !== query) {
    setState({ query, matches: window.matchMedia(query).matches });
  }

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setState({ query, matches: e.matches });
    mediaQueryList.addEventListener("change", onChange);
    return () => mediaQueryList.removeEventListener("change", onChange);
  }, [query]);

  return state.matches;
}
