import { Fragment } from "react";

const QUANTITY = /(\d+(?:\.\d+)?\s?(?:mol\/L|mL|mA|kΩ|Ω|V|A|C|J|s|min|M)(?![A-Za-z0-9]))/g;

/** Renders text with the given quantities (12 V, 6 Ω) emphasised, so the numbers that never change stand out. */
export function QuantityText({ text }: { text: string }) {
  return (
    <>
      {text.split(QUANTITY).map((part, i) =>
        i % 2 === 1 ? <span key={i} className="font-semibold tabular-nums text-brand">{part}</span> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}
