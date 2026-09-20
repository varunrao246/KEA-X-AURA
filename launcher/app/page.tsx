"use client";

import { useState } from "react";
import { products } from "@/config/products";
import KEACard from "@/components/KEACard";
import AURACard from "@/components/AURACard";
import AURAUnavailableModal from "@/components/AURAUnavailableModal";
import GridLines from "@/components/GridLines";

export default function Home() {
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    productName: string;
    envVar: string;
    url: string;
  }>({
    isOpen: false,
    productName: "",
    envVar: "",
    url: "",
  });

  function handleLaunchKEA() {
    if (!products.kea.available || !products.kea.url) {
      setModalConfig({
        isOpen: true,
        productName: "KEA 2.0",
        envVar: "NEXT_PUBLIC_KEA_URL",
        url: products.kea.url,
      });
      return;
    }
    window.open(products.kea.url, "_blank", "noopener,noreferrer");
  }

  function handleLaunchAURA() {
    if (!products.aura.available || !products.aura.url) {
      setModalConfig({
        isOpen: true,
        productName: "AURA Learn",
        envVar: "NEXT_PUBLIC_AURA_URL",
        url: products.aura.url,
      });
      return;
    }
    window.open(products.aura.url, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="launcher-root" aria-label="Bug Busters Launcher">
      {/* Ambient background grid */}
      <GridLines />

      {/* Noise texture overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Header */}
      <header className="launcher-header">
        <div className="header-eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          <span className="eyebrow-text">HACKATHON EDITION · BUG BUSTERS</span>
          <span className="eyebrow-dot" aria-hidden="true" />
        </div>

        <h1 className="brand-title">
          <span className="brand-bug">BUG</span>
          <span className="brand-spacer" aria-hidden="true">·</span>
          <span className="brand-busters">BUSTERS</span>
        </h1>

        <p className="brand-sub">
          <span className="sub-kea">KEA</span>
          <span className="sub-cross" aria-hidden="true">×</span>
          <span className="sub-aura">AURA Learn</span>
        </p>

        <p className="brand-tagline">
          &ldquo;Two adaptive-learning experiences.&nbsp;One vision.&rdquo;
        </p>
      </header>

      {/* Product cards */}
      <section className="cards-section" aria-label="Product selection">
        <KEACard product={products.kea} onLaunch={handleLaunchKEA} />
        <div className="cards-divider" aria-hidden="true">
          <span className="divider-line" />
          <span className="divider-or">OR</span>
          <span className="divider-line" />
        </div>
        <AURACard product={products.aura} onLaunch={handleLaunchAURA} />
      </section>

      {/* Footer */}
      <footer className="launcher-footer">
        <p className="footer-text">
          Launcher&nbsp;
          <span className="footer-sep">·</span>
          &nbsp;
          <code className="footer-url">Unified Hub</code>
          &nbsp;
          <span className="footer-sep">·</span>
          &nbsp;Bug Busters Hub
        </p>
      </footer>

      {/* Product Unavailable / Configuration Modal */}
      {modalConfig.isOpen && (
        <AURAUnavailableModal
          productName={modalConfig.productName}
          envVar={modalConfig.envVar}
          auraUrl={modalConfig.url}
          onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
    </main>
  );
}
