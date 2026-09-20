import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutOutletContext } from "../Layout";

export function useTopBarTitle(title: string | null): void {
  const { setTopBarTitle } = useOutletContext<LayoutOutletContext>();

  useEffect(() => {
    setTopBarTitle(title);
    return () => setTopBarTitle(null);
  }, [title, setTopBarTitle]);
}
