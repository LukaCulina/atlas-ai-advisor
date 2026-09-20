import { useLayoutEffect } from "react";

const DEFAULT_MAX_HEIGHT_PX = 200;

// No dependency array: runs after every render, not just when `value`
// changes. That's deliberate — the textarea can first appear in the DOM on
// a render where `value` is unchanged (e.g. Chat.tsx's textarea only mounts
// once the conversation finishes loading, while `draft` stays ""), so
// depending on `value` alone would miss resizing it the moment it appears.
export function useAutoResizeTextarea(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  _value: string,
  maxHeightPx: number = DEFAULT_MAX_HEIGHT_PX
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // `box-sizing: border-box` means the applied height must include the
    // border for the content box to actually fit `scrollHeight` — otherwise
    // the border eats a couple of pixels and triggers a needless scrollbar.
    const style = window.getComputedStyle(el);
    const borderHeight = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + borderHeight, maxHeightPx)}px`;
  });
}
