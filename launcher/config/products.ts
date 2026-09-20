/**
 * Bug Busters — Centralized Product Configuration
 *
 * This is the SINGLE source of truth for all product URLs.
 *
 * To connect AURA Learn when its project is ready:
 *   1. Start the AURA Learn dev server (it will have its own port).
 *   2. Update AURA_LEARN_URL below to match that port/domain.
 *   3. No other file needs to change.
 */

const isProduction = process.env.NODE_ENV === "production";

// KEA Configuration:
// In production, require NEXT_PUBLIC_KEA_URL. In development, fallback to localhost:3001.
const keaEnvUrl = process.env.NEXT_PUBLIC_KEA_URL;
const keaDevUrl = "http://localhost:3001";
const keaUrl = keaEnvUrl || (!isProduction ? keaDevUrl : "");
const keaAvailable = Boolean(keaEnvUrl || !isProduction);

// AURA Configuration:
// Standardized on NEXT_PUBLIC_AURA_URL with NEXT_PUBLIC_AURA_LEARN_URL as legacy fallback.
// In development, fallback to localhost:3002. In production, require an explicit environment variable.
const auraEnvUrl =
  process.env.NEXT_PUBLIC_AURA_URL || process.env.NEXT_PUBLIC_AURA_LEARN_URL;
const auraDevUrl = "http://localhost:3002";
const auraUrl = auraEnvUrl || (!isProduction ? auraDevUrl : "");
const auraAvailable = Boolean(auraEnvUrl || !isProduction);

export const products = {
  kea: {
    id: "kea",
    name: "KEA 2.0",
    tagline: "Structured Adaptive Learning",
    description:
      "Structured adaptive learning through topic understanding, prerequisites, mastery, and real-time intervention.",
    url: keaUrl,
    theme: "kea",
    available: keaAvailable,
  },

  aura: {
    id: "aura",
    name: "AURA Learn",
    tagline: "Interactive Learning Experience",
    description:
      "An interactive learning experience built around adaptive learning.",
    url: auraUrl,
    theme: "aura",
    available: auraAvailable,
  },
} as const;

export type ProductId = keyof typeof products;
export type Product = (typeof products)[ProductId];

/**
 * To connect AURA Learn later, the only required change is:
 *
 *   aura: {
 *     ...
 *     url: "http://localhost:<AURA_PORT>",   ← change this
 *     available: true,                        ← flip this to true
 *   }
 *
 * Or simply set NEXT_PUBLIC_AURA_LEARN_URL in your .env.local
 */
