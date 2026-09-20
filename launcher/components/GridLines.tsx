"use client";

/**
 * GridLines — ambient background grid decoration
 * Gives the launcher a technical, structured feel.
 */
export default function GridLines() {
  return (
    <div className="grid-lines" aria-hidden="true">
      {/* Vertical columns */}
      <div className="grid-vertical">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="grid-col" />
        ))}
      </div>

      {/* Horizontal rows */}
      <div className="grid-horizontal">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid-row" />
        ))}
      </div>

      {/* Edge vignette to fade grid */}
      <div className="grid-vignette" />
    </div>
  );
}
