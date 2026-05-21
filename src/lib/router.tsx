import { useEffect, useState } from "react";

export type Route = {
  path: string;
  query: URLSearchParams;
};

function readRoute(): Route {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, queryString = ""] = raw.split("?");
  return {
    path: path.startsWith("/") ? path : `/${path}`,
    query: new URLSearchParams(queryString),
  };
}

export function navigate(path: string): void {
  const target = path.startsWith("#") ? path : `#${path}`;
  if (window.location.hash !== target) {
    window.location.hash = target;
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => readRoute());
  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function Link(props: {
  to: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}): React.ReactElement {
  const { to, className, children, onClick } = props;
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        navigate(to);
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
