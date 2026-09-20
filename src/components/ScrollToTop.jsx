import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Scrolls to the top of the page whenever the route (pathname) changes,
// so every new page view starts at the top instead of preserving scroll position.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}