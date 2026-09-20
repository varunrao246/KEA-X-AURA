"use client";

import { useEffect, useState } from "react";

/** Time-of-day greeting computed in the browser so it matches the viewer's clock, not the server's. */
export function Greeting({ name }: { name: string }) {
  const [salutation, setSalutation] = useState("Welcome back");

  useEffect(() => {
    const h = new Date().getHours();
    setSalutation(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <>
      {salutation}, {name}
    </>
  );
}
