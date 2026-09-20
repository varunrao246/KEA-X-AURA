"use client";

import { type Product } from "@/config/products";

interface AURACardProps {
  product: Product;
  onLaunch: () => void;
}

/**
 * AURACard — expressive, interactive, colorful card.
 * Visual identity: purple-teal-gold gradient, animated orb, vibrant.
 *
 * IMPORTANT: AURA Learn is CONFIGURATION-READY / NOT YET RUNNING.
 * This card intentionally shows the "not yet running" state when
 * product.available === false. No fake AURA content is shown.
 */
export default function AURACard({ product, onLaunch }: AURACardProps) {
  const isAvailable = product.available;

  return (
    <article className="aura-card" aria-label="AURA Learn product card">
      {/* Animated orb decoration */}
      <div className="aura-orb-decoration" aria-hidden="true" />

      {/* Header */}
      <header className="aura-card-header">
        <div className="aura-badge" aria-label="Product type">
          <span className="aura-badge-dot" />
          <span className="aura-badge-text">INTERACTIVE · ADAPTIVE</span>
          {!isAvailable && (
            <span className="aura-badge-status" aria-label="Status: configuration ready">
              · CONFIG-READY
            </span>
          )}
        </div>

        <h2 className="aura-card-title">{product.name}</h2>
        <p className="aura-card-tagline">{product.tagline}</p>
      </header>

      {/* Description */}
      <p className="aura-card-description">{product.description}</p>

      {/* Interactive indicators */}
      <div className="aura-indicators" aria-label="Learning characteristics">
        <span className="aura-indicator">
          <span className="aura-indicator-icon" aria-hidden="true">◈</span>
          Interactive
        </span>
        <span className="aura-indicator">
          <span className="aura-indicator-icon" aria-hidden="true">◎</span>
          Adaptive
        </span>
        <span className="aura-indicator">
          <span className="aura-indicator-icon" aria-hidden="true">◐</span>
          Expressive
        </span>
      </div>

      {/* Not-yet-running notice (shown when unavailable) */}
      {!isAvailable && (
        <div
          className="aura-coming-notice"
          role="status"
          aria-label="AURA Learn availability notice"
        >
          <span className="aura-notice-icon" aria-hidden="true">⚬</span>
          <p className="aura-notice-text">
            <strong>Configuration ready.</strong> AURA Learn will connect to{" "}
            <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
              {product.url}
            </code>{" "}
            once the AURA project is running. Start AURA Learn and click the button below.
          </p>
        </div>
      )}

      {/* Launch button */}
      <button
        id="aura-launch-btn"
        className={`aura-launch-btn${!isAvailable ? " unavailable" : ""}`}
        onClick={onLaunch}
        aria-label={
          isAvailable
            ? "Launch AURA Learn application"
            : "AURA Learn is not running yet — click for instructions"
        }
        type="button"
      >
        {isAvailable ? (
          <>
            Launch AURA Learn
            <span aria-hidden="true">→</span>
          </>
        ) : (
          <>
            Launch AURA Learn
            <span aria-hidden="true" style={{ opacity: 0.6 }}>○</span>
          </>
        )}
      </button>
    </article>
  );
}
