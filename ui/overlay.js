export function createOverlay(root) {
  function clear() {
    root.innerHTML = "";
  }

  function showConfirm({ title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel }) {
    root.innerHTML = `
      <div class="overlay">
        <div class="overlay-card">
          <h1>${title}</h1>
          <p>${body}</p>
          <div class="overlay-actions">
            <button id="overlay-cancel" class="overlay-button secondary">${cancelLabel}</button>
            <button id="overlay-confirm" class="overlay-button">${confirmLabel}</button>
          </div>
        </div>
      </div>
    `;

    root.querySelector("#overlay-cancel")?.addEventListener("click", () => {
      clear();
      onCancel?.();
    });

    root.querySelector("#overlay-confirm")?.addEventListener("click", () => {
      clear();
      onConfirm?.();
    });
  }

  function showWin({ level, empireScore, onContinue }) {
    root.innerHTML = `
      <div class="overlay">
        <div class="overlay-card">
          <h1>Empire Complete</h1>
          <p>Your Market turned this frontier into a thriving settlement.</p>
          <p>Level ${level} • Empire Score ${empireScore}</p>
          <button id="overlay-close" class="overlay-button">Keep Exploring</button>
        </div>
      </div>
    `;

    root.querySelector("#overlay-close")?.addEventListener("click", () => {
      clear();
      onContinue?.();
    });
  }

  return {
    clear,
    showConfirm,
    showWin,
  };
}
