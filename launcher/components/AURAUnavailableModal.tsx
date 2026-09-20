"use client";

interface AURAUnavailableModalProps {
  auraUrl?: string;
  productName?: string;
  envVar?: string;
  onClose: () => void;
}

/**
 * AURAUnavailableModal — shown when the user clicks "Launch"
 * but the application is not running or the deployment URL is not configured.
 *
 * This is the graceful unavailable / configuration state handler:
 * - Clearly explains status without silent failure or fallback
 * - Shows the required environment variable for production setup
 * - Does NOT iframe or embed anything
 */
export default function AURAUnavailableModal({
  auraUrl = "",
  productName = "AURA Learn",
  envVar = "NEXT_PUBLIC_AURA_URL",
  onClose,
}: AURAUnavailableModalProps) {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isConfigMissing = !auraUrl;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aura-modal-title"
      aria-describedby="aura-modal-description"
      onClick={handleBackdropClick}
    >
      <div className="modal-panel">
        {/* Close button */}
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
          type="button"
        >
          ✕
        </button>

        {/* Icon */}
        <div className="modal-icon" aria-hidden="true">
          ◎
        </div>

        {/* Header */}
        <div className="modal-header">
          <h2 id="aura-modal-title" className="modal-title">
            {productName} — {isConfigMissing ? "URL Not Configured" : "Not Running Yet"}
          </h2>
        </div>

        {/* Body */}
        <div className="modal-body" id="aura-modal-description">
          <p className="modal-message">
            {isConfigMissing ? (
              <>
                <strong>{productName} deployment URL is not configured.</strong> In production,
                the launcher requires <code>{envVar}</code> to open the deployed application.
              </>
            ) : (
              <>
                <strong>{productName} is not running yet.</strong> Start the {productName}{" "}
                application and try again.
              </>
            )}
          </p>

          <div className="modal-url-block">
            <span className="modal-url-label">
              {isConfigMissing ? "Required Environment Variable" : "Configured URL"}
            </span>
            <code className="modal-url-code">
              {isConfigMissing ? envVar : auraUrl}
            </code>
          </div>

          <div className="modal-hint">
            <p>
              {isConfigMissing ? (
                <>
                  In your Vercel project settings, set <code>{envVar}</code> to the
                  URL of your deployed {productName} application.
                </>
              ) : (
                <>
                  When the project is available, start it on the port above (or update{" "}
                  <code>{envVar}</code> in <code>.env.local</code>).
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action */}
        <button
          className="modal-close-action-btn"
          onClick={onClose}
          type="button"
          aria-label="Dismiss dialog"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
