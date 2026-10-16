import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router";

/**
 * Sets the document title and, after an in-app navigation, moves focus to the page heading
 * (screen-reader orientation). On a fresh page load focus is left alone so the skip link stays first.
 */
export function Page({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { key } = useLocation();
  useEffect(() => {
    document.title = `${title} - Interview Orbit`;
    if (key !== "default") headingRef.current?.focus();
  }, [title, key]);
  return (
    <div className="stack">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 ref={headingRef} tabIndex={-1}>
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
}
