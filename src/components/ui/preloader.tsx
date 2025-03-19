"use client";

import { useEffect, useState } from "react";

export function Preloader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`preloader ${!loading ? 'loaded' : ''}`}>
      <div className="preloader-spinner"></div>
    </div>
  );
}