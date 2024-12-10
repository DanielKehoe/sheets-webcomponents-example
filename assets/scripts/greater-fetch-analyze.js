import {
  LitElement,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { sheetsManager } from "./sheets-api-manager.js";

// Language API Manager
class LanguageAPIManager {
  static instance = null;

  constructor() {
    if (LanguageAPIManager.instance) {
      return LanguageAPIManager.instance;
    }
    this.initPromise = null;
    this.DISCOVERY_DOC =
      "https://language.googleapis.com/$discovery/rest?version=v1";
    LanguageAPIManager.instance = this;
  }

  static getInstance() {
    if (!LanguageAPIManager.instance) {
      LanguageAPIManager.instance = new LanguageAPIManager();
    }
    return LanguageAPIManager.instance;
  }

  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        if (!window.gapi?.client) {
          throw new Error("Google API client not available");
        }

        await gapi.client.load(this.DISCOVERY_DOC);
        console.log("Language API initialized");
        resolve(true);
      } catch (error) {
        this.initPromise = null;
        reject(
          new Error(`Failed to initialize Language API: ${error.message}`),
        );
      }
    });

    return this.initPromise;
  }

  async waitForReady() {
    try {
      await this.initialize();
      return true;
    } catch (error) {
      console.error("Language API initialization failed:", error);
      return false;
    }
  }

  isInitialized() {
    return this.initPromise && this.initPromise.status !== "rejected";
  }

  canMakeApiCalls() {
    // Check API initialization
    if (!this.isInitialized()) {
      return {
        allowed: false,
        reason: "Language API not initialized",
      };
    }

    // Check if token exists
    const token = gapi.client.getToken();
    if (!token) {
      return {
        allowed: false,
        reason: "No access token available",
      };
    }

    return {
      allowed: true,
      reason: null,
    };
  }
}

const languageManager = new LanguageAPIManager();

export class GreaterFetchAnalyze extends LitElement {
  static properties = {
    isLoading: { type: Boolean },
    sheetId: { type: String },
    sheetsApiReady: { type: Boolean },
    languageApiReady: { type: Boolean },
    successMessage: { type: String },
  };

  constructor() {
    super();
    this.isLoading = false;
    this.sheetsApiReady = false;
    this.languageApiReady = false;
    this.successMessage = "";
    this.initializeAPIs();
  }

  async initializeAPIs() {
    try {
      // Wait for sheet ID first
      await this.loadSheetId();

      // Wait for initial token to be available
      let retries = 0;
      while (!gapi.client.getToken() && retries < 5) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        retries++;
      }

      if (!gapi.client.getToken()) {
        throw new Error("No access token available after waiting");
      }

      // Initialize both APIs in parallel
      const [sheetsReady, languageReady] = await Promise.all([
        sheetsManager.waitForReady(),
        languageManager.waitForReady(),
      ]);

      this.sheetsApiReady = sheetsReady;
      this.languageApiReady = languageReady;

      if (!sheetsReady || !languageReady) {
        throw new Error("One or more APIs failed to initialize");
      }

      console.log("APIs initialized successfully");
      this.requestUpdate();
    } catch (error) {
      console.error("API initialization failed:", error);
      this.dispatchError("Failed to initialize APIs", error);
    }
  }

  async loadSheetId() {
    return new Promise((resolve) => {
      const stored = sessionStorage.getItem("greater-current-sheet-id");
      if (stored) {
        const { id } = JSON.parse(stored);
        this.sheetId = id;
        resolve(id);
      } else {
        window.addEventListener(
          "greater-sheet-created",
          (e) => {
            this.sheetId = e.detail.id;
            resolve(e.detail.id);
          },
          { once: true },
        );
      }
    });
  }

  async fetchUrlContent(url) {
    const response = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Failed to fetch URL content");
    }

    const { content } = await response.json();
    return content;
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.clearError();
    this.successMessage = ""; // Clear any previous success message

    const form = e.target;

    if (!this.validateContent(form)) {
      return;
    }

    try {
      const canProceed = await this.canMakeApiCalls();
      if (!canProceed) {
        return;
      }

      if (!this.sheetId) {
        this.dispatchError(
          "No active sheet found",
          new Error("Missing sheet ID"),
        );
        return;
      }

      const url = form.url.value.trim();
      if (!this.validateUrl(url)) {
        return;
      }

      this.isLoading = true;
      try {
        // Fetch URL content through our proxy
        const text = await this.fetchUrlContent(url);

        // Validate content
        if (!text.trim()) {
          throw new Error("URL returned empty content");
        }

        // Check content size (Language API limit is 1MB)
        const contentSize = new Blob([text]).size;
        const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB in bytes
        if (contentSize > MAX_CONTENT_SIZE) {
          throw new Error(
            `URL content exceeds size limit (${(contentSize / 1024 / 1024).toFixed(1)}MB > 1MB)`,
          );
        }

        // Analyze with Language API
        const result = await gapi.client.language.documents.analyzeEntities({
          document: {
            content: text,
            type: "PLAIN_TEXT",
          },
        });

        // Filter and process entities
        const entities = result.result.entities
          .filter((entity) => entity.type === "PERSON")
          .map((entity) => [
            entity.name,
            entity.type,
            entity.salience.toFixed(3),
          ]);

        // Clear existing keywords (except header)
        await gapi.client.sheets.spreadsheets.values.clear({
          spreadsheetId: this.sheetId,
          range: "Keywords!A2:C",
        });

        // Write entities to Keywords tab
        if (entities.length > 0) {
          await this.updateValues(
            this.sheetId,
            "Keywords!A2:C" + (entities.length + 1),
            entities,
          );
        }

        // Log the analysis
        const timestamp = new Date().toLocaleString();
        await this.updateValues(this.sheetId, "Logs!A2:B2", [
          [
            timestamp,
            `URL analyzed: ${url} (found ${entities.length} person entities)`,
          ],
        ]);

        // Set success message
        this.successMessage = `Analysis complete! Found ${entities.length} person mentions.`;

        // Reset form using stored reference
        form.reset();
      } catch (error) {
        // Log specific content errors to sheet
        if (
          error.message.includes("empty content") ||
          error.message.includes("size limit")
        ) {
          const timestamp = new Date().toLocaleString();
          await this.updateValues(this.sheetId, "Logs!A2:B2", [
            [timestamp, `Error: ${error.message} - ${url}`],
          ]).catch(() => {
            console.error("Failed to log error to sheet:", error);
          });
        }
        this.dispatchError("Failed to analyze URL", error);
        this.successMessage = ""; // Clear success message on error
      } finally {
        this.isLoading = false;
      }
    } catch (error) {
      console.error("API check failed:", error);
      this.dispatchError("Failed to verify API access", error);
    }
  }

  validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      this.dispatchError(
        "Invalid URL format",
        new Error("URL validation failed"),
      );
      return false;
    }
  }

  async updateValues(spreadsheetId, range, values) {
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      resource: { values },
    });
  }

  validateContent(form) {
    const urlInput = form.querySelector("#url");
    if (!urlInput || !urlInput.value.trim()) {
      this.dispatchError("URL is required", new Error("Empty URL provided"));
      return false;
    }
    return true;
  }

  async canMakeApiCalls() {
    try {
      // Check token first
      const token = gapi.client.getToken();
      if (!token) {
        this.dispatchError(
          "Authentication required",
          new Error("No access token available"),
        );
        return false;
      }

      // Check APIs
      const [sheetsStatus, languageStatus] = await Promise.all([
        sheetsManager.canMakeApiCalls(),
        languageManager.canMakeApiCalls(),
      ]);

      if (!sheetsStatus.allowed) {
        this.dispatchError(
          "Sheets API not ready",
          new Error(sheetsStatus.reason),
        );
        return false;
      }

      if (!languageStatus.allowed) {
        this.dispatchError(
          "Language API not ready",
          new Error(languageStatus.reason),
        );
        return false;
      }

      return true;
    } catch (error) {
      this.dispatchError("API check failed", error);
      return false;
    }
  }

  dispatchError(message, error) {
    this.dispatchEvent(
      new CustomEvent("greater-error", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: new Date().toISOString(),
          component: "greater-fetch-analyze",
          type: "ERROR",
          message,
          technical: error.message,
          stack: error.stack,
          critical: false,
        },
      }),
    );
  }

  clearError() {
    this.dispatchEvent(
      new CustomEvent("greater-error", {
        bubbles: true,
        composed: true,
        detail: null,
      }),
    );
  }

  render() {
    if (!this.sheetsApiReady || !this.languageApiReady) {
      return html`
        <div class="mt-8 text-slate-600">
          ${!this.sheetsApiReady ? "Initializing Sheets API..." : ""}
          ${!this.languageApiReady ? "Initializing Language API..." : ""}
        </div>
      `;
    }

    if (!this.sheetId) {
      return html`
        <div class="mt-8 text-slate-600">Waiting for active sheet...</div>
      `;
    }

    return html`
      <div class="mt-8 space-y-6">
        ${this.successMessage
          ? html`
              <div class="bg-green-50 border border-green-400 rounded p-4 mb-4">
                <p class="text-green-700">${this.successMessage}</p>
              </div>
            `
          : ""}

        <form @submit=${this.handleSubmit} class="space-y-6">
          <div>
            <label for="url" class="block text-sm font-medium text-slate-700">
              Get Keywords from URL
            </label>
            <input
              type="url"
              id="url"
              name="url"
              required
              ?disabled=${!this.sheetsApiReady || !this.languageApiReady}
              class="mt-1 block w-full rounded-md border-slate-300
                                     shadow-sm focus:border-slate-500
                                     focus:ring-slate-500"
              placeholder="https://example.com"
            />
          </div>
          <button
            type="submit"
            ?disabled=${this.isLoading ||
            !this.sheetsApiReady ||
            !this.languageApiReady}
            class="inline-flex justify-center rounded-md border
                                 border-transparent bg-slate-900 py-2 px-4 text-sm
                                 font-medium text-white shadow-sm hover:bg-slate-800
                                 focus:outline-none focus:ring-2 focus:ring-slate-500
                                 focus:ring-offset-2 disabled:opacity-50"
          >
            ${this.isLoading ? "Processing..." : "Get Keywords"}
          </button>
        </form>
      </div>
    `;
  }
}

customElements.define("greater-fetch-analyze", GreaterFetchAnalyze);
