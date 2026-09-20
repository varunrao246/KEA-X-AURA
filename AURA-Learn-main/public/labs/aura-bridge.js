/*
 * AURA lab bridge. Include this in any HTML lab to integrate it with AURA Learn:
 *
 *   <script src="/labs/aura-bridge.js"></script>
 *   ...
 *   AURA.complete({ score: 85, mistakes: 1 });   // score is 0-100
 *
 * It also keeps the lab's light/dark theme in step with the app.
 * Use AURA.onTheme(fn) if the lab draws to a canvas and needs to repaint.
 */
(function () {
  var root = document.documentElement;
  var listeners = [];

  function setTheme(t) {
    root.setAttribute("data-theme", t === "dark" ? "dark" : "light");
    listeners.forEach(function (fn) { try { fn(root.getAttribute("data-theme")); } catch (e) {} });
  }

  var fromQuery = new URLSearchParams(location.search).get("theme");
  setTheme(fromQuery || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "aura:theme") setTheme(e.data.theme);
  });

  window.AURA = {
    labId: document.documentElement.getAttribute("data-lab-id"),
    complete: function (result) {
      var score = Math.max(0, Math.min(100, Math.round(result.score)));
      var msg = { type: "aura:lab-result", labId: window.AURA.labId, score: score, mistakes: result.mistakes || 0 };
      if (window.parent !== window) window.parent.postMessage(msg, location.origin);
      return msg;
    },
    onTheme: function (fn) { listeners.push(fn); },
    cssVar: function (name) { return getComputedStyle(root).getPropertyValue(name).trim(); },
  };
})();
