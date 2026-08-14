(() => {
  "use strict";

  const DEFAULTS = Object.freeze({
    position: "bottom",
    fontSize: "medium",
    textColor: "#ffffff",
    backgroundOpacity: 75,
  });

  const form = document.getElementById("settings-form");
  const fontSize = document.getElementById("font-size");
  const textColor = document.getElementById("text-color");
  const colorValue = document.getElementById("color-value");
  const backgroundOpacity = document.getElementById("background-opacity");
  const opacityValue = document.getElementById("opacity-value");
  const saveStatus = document.getElementById("save-status");
  let saveTimer;

  function updateDisplayedValues() {
    colorValue.value = textColor.value.toUpperCase();
    opacityValue.value = `${backgroundOpacity.value}%`;
  }

  function readForm() {
    return {
      position: form.elements.position.value,
      fontSize: fontSize.value,
      textColor: textColor.value,
      backgroundOpacity: Number(backgroundOpacity.value),
    };
  }

  function showSaved() {
    saveStatus.textContent = "Saved";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveStatus.textContent = "Saved automatically";
    }, 1200);
  }

  chrome.storage.sync.get(DEFAULTS, (settings) => {
    form.elements.position.value = settings.position;
    fontSize.value = settings.fontSize;
    textColor.value = settings.textColor;
    backgroundOpacity.value = settings.backgroundOpacity;
    updateDisplayedValues();
  });

  form.addEventListener("input", () => {
    updateDisplayedValues();
    chrome.storage.sync.set(readForm(), showSaved);
  });
})();
