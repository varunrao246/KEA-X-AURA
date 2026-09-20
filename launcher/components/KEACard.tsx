"use client";

import { type Product } from "@/config/products";

interface KEACardProps {
  product: Product;
  onLaunch: () => void;
}

/**
 * KEACard — structured, monochrome, technical card.
 * Visual identity: black / white / grayscale, knowledge-graph feel.
 */
export default function KEACard({ product, onLaunch }: KEACardProps) {
  return (
    <article className="kea-card" aria-label="KEA product card">
      {/* Knowledge graph SVG decoration */}
      <svg
        className="kea-graph-decoration"
        viewBox="0 0 220 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Nodes */}
        <circle cx="110" cy="30" r="8" fill="white" />
        <circle cx="30" cy="110" r="6" fill="white" />
        <circle cx="190" cy="110" r="6" fill="white" />
        <circle cx="70" cy="180" r="5" fill="white" />
        <circle cx="150" cy="180" r="5" fill="white" />
        <circle cx="110" cy="110" r="10" fill="white" />
        <circle cx="60" cy="60" r="4" fill="white" />
        <circle cx="160" cy="60" r="4" fill="white" />
        {/* Edges */}
        <line x1="110" y1="30" x2="110" y2="110" stroke="white" strokeWidth="1" />
        <line x1="110" y1="110" x2="30" y2="110" stroke="white" strokeWidth="1" />
        <line x1="110" y1="110" x2="190" y2="110" stroke="white" strokeWidth="1" />
        <line x1="110" y1="110" x2="70" y2="180" stroke="white" strokeWidth="1" />
        <line x1="110" y1="110" x2="150" y2="180" stroke="white" strokeWidth="1" />
        <line x1="110" y1="30" x2="60" y2="60" stroke="white" strokeWidth="0.5" />
        <line x1="110" y1="30" x2="160" y2="60" stroke="white" strokeWidth="0.5" />
        <line x1="60" y1="60" x2="30" y2="110" stroke="white" strokeWidth="0.5" />
        <line x1="160" y1="60" x2="190" y2="110" stroke="white" strokeWidth="0.5" />
      </svg>

      {/* Header */}
      <header className="kea-card-header">
        <div className="kea-badge" aria-label="Product type">
          <span className="kea-badge-dot" />
          <span className="kea-badge-text">STRUCTURED · ADAPTIVE</span>
        </div>

        <h2 className="kea-card-title">{product.name}</h2>
        <p className="kea-card-tagline">{product.tagline}</p>
      </header>

      {/* Description */}
      <p className="kea-card-description">{product.description}</p>

      {/* Attribute grid — knowledge-graph vocabulary */}
      <div className="kea-attributes" aria-label="Key features">
        <span className="kea-attr">Topic Understanding</span>
        <span className="kea-attr">Prerequisites</span>
        <span className="kea-attr">Mastery Tracking</span>
        <span className="kea-attr">Real-time Intervention</span>
      </div>

      {/* Launch button */}
      <button
        id="kea-launch-btn"
        className={`kea-launch-btn${!product.available ? " unavailable" : ""}`}
        onClick={onLaunch}
        aria-label={
          product.available
            ? "Launch KEA 2.0 application"
            : "KEA 2.0 URL not configured — click for instructions"
        }
        type="button"
      >
        Launch KEA 2.0
        <span className="btn-arrow" aria-hidden="true">→</span>
      </button>
    </article>
  );
}
