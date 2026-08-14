(() => {
  "use strict";

  const DEFAULTS = Object.freeze({
    position: "bottom",
    fontSize: "medium",
    textColor: "#ffffff",
    backgroundOpacity: 75,
  });

  const FONT_SIZES = Object.freeze({
    small: "clamp(16px, 1.35vw, 22px)",
    medium: "clamp(20px, 1.75vw, 30px)",
    large: "clamp(26px, 2.25vw, 38px)",
    xlarge: "clamp(32px, 2.9vw, 50px)",
  });

  const STYLE_ID = "yt-caption-override-styles";
  const CAPTION_WINDOW_SELECTOR = [
    ".ytp-caption-window-container .caption-window",
    ".ytp-caption-window-container [class*='caption-window']",
    ".caption-window",
  ].join(",");

  let settings = { ...DEFAULTS };
  let observer;
  let applyQueued = false;

  function isHexColor(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  }

  function normalizeSettings(value = {}) {
    const opacity = Number(value.backgroundOpacity);

    return {
      position: value.position === "top" ? "top" : DEFAULTS.position,
      fontSize: Object.hasOwn(FONT_SIZES, value.fontSize)
        ? value.fontSize
        : DEFAULTS.fontSize,
      textColor: isHexColor(value.textColor)
        ? value.textColor.toLowerCase()
        : DEFAULTS.textColor,
      backgroundOpacity: Number.isFinite(opacity)
        ? Math.min(100, Math.max(0, Math.round(opacity)))
        : DEFAULTS.backgroundOpacity,
    };
  }

  function ensureStyleElement() {
    let style = document.getElementById(STYLE_ID);
    if (style) return style;

    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .ytp-caption-window-container .ytp-caption-segment,
      .ytp-caption-window-container [class*="caption-segment"],
      .caption-window .ytp-caption-segment,
      .caption-window [class*="caption-segment"] {
        color: var(--ytcco-text-color) !important;
        font-size: var(--ytcco-font-size) !important;
        background: var(--ytcco-background) !important;
        background-color: var(--ytcco-background) !important;
        text-shadow: none !important;
      }

      .ytp-caption-window-container .caption-window,
      .ytp-caption-window-container .caption-visual-line {
        color: var(--ytcco-text-color) !important;
        font-size: var(--ytcco-font-size) !important;
        background: transparent !important;
        background-color: transparent !important;
      }

      .ytp-caption-window-container .caption-window,
      .ytp-caption-window-container [class*="caption-window"],
      .caption-window {
        left: 50% !important;
        right: auto !important;
        width: max-content !important;
        max-width: 92% !important;
        transform: translateX(-50%) !important;
      }

      html[data-ytcco-position="top"] .ytp-caption-window-container .caption-window,
      html[data-ytcco-position="top"] .ytp-caption-window-container [class*="caption-window"],
      html[data-ytcco-position="top"] .caption-window {
        top: 8% !important;
        bottom: auto !important;
      }

      html[data-ytcco-position="bottom"] .ytp-caption-window-container .caption-window,
      html[data-ytcco-position="bottom"] .ytp-caption-window-container [class*="caption-window"],
      html[data-ytcco-position="bottom"] .caption-window {
        top: auto !important;
        bottom: 6% !important;
      }
    `;

    (document.head || document.documentElement).appendChild(style);
    return style;
  }

  function setImportant(element, property, value) {
    if (
      element.style.getPropertyValue(property) !== value ||
      element.style.getPropertyPriority(property) !== "important"
    ) {
      element.style.setProperty(property, value, "important");
    }
  }

  function setRootProperty(property, value) {
    const rootStyle = document.documentElement.style;
    if (rootStyle.getPropertyValue(property) !== value) {
      rootStyle.setProperty(property, value);
    }
  }

  function applyToCaptionWindows() {
    const isTop = settings.position === "top";

    document.querySelectorAll(CAPTION_WINDOW_SELECTOR).forEach((windowElement) => {
      setImportant(windowElement, "left", "50%");
      setImportant(windowElement, "right", "auto");
      setImportant(windowElement, "width", "max-content");
      setImportant(windowElement, "max-width", "92%");
      setImportant(windowElement, "transform", "translateX(-50%)");
      setImportant(windowElement, "top", isTop ? "8%" : "auto");
      setImportant(windowElement, "bottom", isTop ? "auto" : "6%");
    });
  }

  function applySettings() {
    ensureStyleElement();

    const root = document.documentElement;
    const alpha = settings.backgroundOpacity / 100;
    root.dataset.ytccoPosition = settings.position;
    setRootProperty("--ytcco-font-size", FONT_SIZES[settings.fontSize]);
    setRootProperty("--ytcco-text-color", settings.textColor);
    setRootProperty("--ytcco-background", `rgba(0, 0, 0, ${alpha})`);

    applyToCaptionWindows();
  }

  function queueApply() {
    if (applyQueued) return;
    applyQueued = true;

    requestAnimationFrame(() => {
      applyQueued = false;
      applySettings();
    });
  }

  function beginObserving() {
    if (observer || !document.documentElement) return;

    observer = new MutationObserver((mutations) => {
      const captionChanged = mutations.some((mutation) => {
        const target = mutation.target;

        if (
          target instanceof Element &&
          (target.matches(CAPTION_WINDOW_SELECTOR) ||
            target.matches(".ytp-caption-window-container, .ytp-caption-segment, .caption-visual-line"))
        ) {
          return true;
        }

        return [...mutation.addedNodes].some(
          (node) =>
            node instanceof Element &&
            (node.matches(
              ".ytp-caption-window-container, .caption-window, .ytp-caption-segment, .caption-visual-line",
            ) ||
              node.querySelector(
                ".ytp-caption-window-container, .caption-window, .ytp-caption-segment, .caption-visual-line",
              )),
        );
      });

      if (captionChanged) queueApply();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });
  }

  chrome.storage.sync.get(DEFAULTS, (storedSettings) => {
    settings = normalizeSettings(storedSettings);
    applySettings();
    beginObserving();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;

    const nextSettings = { ...settings };
    for (const key of Object.keys(DEFAULTS)) {
      if (changes[key]) nextSettings[key] = changes[key].newValue;
    }

    settings = normalizeSettings(nextSettings);
    queueApply();
  });
})();
