import {
  LitElement,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class GreaterErrors extends LitElement {
  static properties = {
    errors: { type: Array },
  };

  constructor() {
    super();
    this.errors = [];
    window.addEventListener("greater-error", this.handleError.bind(this));
  }

  handleError(event) {
    // If detail is null, clear all errors
    if (!event.detail) {
      this.errors = [];
      return;
    }

    const error = event.detail;
    console.error(`[${error.component}] ${error.message}`, error);

    // Add to queue (max 3)
    this.errors = [...this.errors, error].slice(-3);
    this.requestUpdate();

    // Auto-dismiss non-critical errors
    if (!error.critical) {
      setTimeout(() => {
        this.removeError(error);
      }, 30000);
    }
  }

  removeError(errorToRemove) {
    this.errors = this.errors.filter((error) => error !== errorToRemove);
  }

  render() {
    return html`
      <div class="fixed top-4 right-4 z-50 space-y-4">
        ${this.errors.map(
          (error) => html`
            <div
              class="bg-white shadow-lg rounded-lg p-4 max-w-md border-l-4 ${error.type ===
              "ERROR"
                ? "border-red-600"
                : "border-yellow-600"}"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p
                    class="font-medium ${error.type === "ERROR"
                      ? "text-red-600"
                      : "text-yellow-600"}"
                  >
                    ${error.type}
                  </p>
                  <p class="text-slate-600 mt-1">${error.message}</p>
                  <p class="text-slate-400 text-sm mt-2">
                    ${new Date(error.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  @click=${() => this.removeError(error)}
                  class="text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>
            </div>
          `,
        )}
      </div>
    `;
  }
}

customElements.define("greater-errors", GreaterErrors);
