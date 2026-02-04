import { useEffect, useRef, useState } from "react";

export default function useOnScreen(ref: React.RefObject<Element>): boolean {
  const [isIntersecting, setIntersecting] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting));
  }, []);

  useEffect(() => {
    if (ref?.current && observer.current) {
      observer.current.observe(ref.current);
    }
    return () => {
      observer.current?.disconnect();
    };
  }, [ref?.current]);

  return isIntersecting;
}
