import {
  LitElement,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { sheetsManager } from "./sheets-api-manager.js";

export class GreaterCreateSheet extends LitElement {
  static properties = {
    isLoading: { type: Boolean },
    sheetCreated: { type: Boolean },
    apiReady: { type: Boolean },
    pendingAnalyzeMount: { type: Boolean },
    guestName: { type: String },
  };

  constructor() {
    super();
    this.isLoading = false;
    this.sheetCreated = false;
    this.apiReady = false;
    this.pendingAnalyzeMount = false;
    this.guestName = "";
    this.initializeSheetsAPI();
  }

  async firstUpdated() {
    console.log("Create Sheet first render complete");
    if (this.pendingAnalyzeMount) {
      console.log("Processing pending analyze component mount");
      await this.mountAnalyzeComponent();
      this.pendingAnalyzeMount = false;
    }
  }

  updated(changedProperties) {
    if (
      changedProperties.has("pendingAnalyzeMount") &&
      this.pendingAnalyzeMount
    ) {
      console.log("PendingAnalyzeMount changed, attempting mount");
      this.mountAnalyzeComponent();
    }
  }

  async mountAnalyzeComponent() {
    console.log("Attempting to mount greater-fetch-analyze component");

    try {
      await this.updateComplete; // Wait for any pending renders

      // Verify the content div exists
      const contentDiv = this.shadowRoot?.querySelector(".content");
      if (!contentDiv) {
        throw new Error(
          "Content container not found in DOM. Shadow root status: " +
            (this.shadowRoot ? "exists" : "missing"),
        );
      }

      // Create component
      let fetchAnalyze;
      try {
        fetchAnalyze = document.createElement("greater-fetch-analyze");
        if (!fetchAnalyze) {
          throw new Error("Failed to create greater-fetch-analyze element");
        }
      } catch (error) {
        throw new Error(`Component creation failed: ${error.message}`);
      }

      // Verify component was defined
      if (!customElements.get("greater-fetch-analyze")) {
        throw new Error("greater-fetch-analyze component is not registered");
      }

      // Mount component
      try {
        contentDiv.appendChild(fetchAnalyze);
        console.log("greater-fetch-analyze component mounted successfully");
      } catch (error) {
        throw new Error(`Component mounting failed: ${error.message}`);
      }

      // Verify mounting
      if (!contentDiv.contains(fetchAnalyze)) {
        throw new Error("Component mount verification failed");
      }
    } catch (error) {
      console.error("Analyze component mounting error:", error);
      this.dispatchError("Failed to initialize URL analysis interface", error);
      throw error;
    }
  }

  async initializeSheetsAPI() {
    try {
      this.apiReady = await sheetsManager.waitForReady();
      if (!this.apiReady) {
        this.dispatchError(
          "Google Sheets API initialization failed",
          new Error("API not ready"),
        );
        return;
      }
      console.log("Sheets API ready");
    } catch (error) {
      this.dispatchError("Failed to initialize Sheets API", error);
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (!this.apiReady) {
      this.dispatchError(
        "Please wait for API initialization",
        new Error("API not ready"),
      );
      return;
    }

    const guestName = e.target.guestName.value.trim();
    if (!this.validateGuestName(guestName)) {
      return;
    }

    this.isLoading = true;
    try {
      const sheet = await this.createSheet(guestName);
      if (!sheet) {
        throw new Error("Failed to create sheet - no response data");
      }

      this.sheetCreated = true;
      this.sheetId = sheet.spreadsheetId;
      this.sheetUrl = sheet.spreadsheetUrl;
      this.guestName = guestName;

      // Store sheet info and notify other components
      const sheetData = {
        id: sheet.spreadsheetId,
        name: guestName,
        created: new Date().toISOString(),
      };
      sessionStorage.setItem(
        "greater-current-sheet-id",
        JSON.stringify(sheetData),
      );
      this.dispatchEvent(
        new CustomEvent("greater-sheet-created", {
          bubbles: true,
          composed: true,
          detail: sheetData,
        }),
      );

      // Set pending mount for fetch-analyze component
      this.pendingAnalyzeMount = true;
      this.requestUpdate();
    } catch (error) {
      console.error("Sheet creation failed:", error);
      this.dispatchError("Failed to create sheet", error);
    } finally {
      this.isLoading = false;
    }
  }

  validateGuestName(name) {
    if (name.length < 2 || name.length > 50) {
      this.dispatchError(
        "Guest name must be between 2 and 50 characters",
        new Error("Invalid name length"),
      );
      return false;
    }
    if (!/^[a-zA-Z0-9 '-]+$/.test(name)) {
      this.dispatchError(
        "Guest name contains invalid characters",
        new Error("Invalid characters"),
      );
      return false;
    }
    return true;
  }

  async createSheet(guestName) {
    if (!sheetsManager.isInitialized()) {
      throw new Error("Sheets API not initialized");
    }

    const sheetTitle = `${guestName} Lead List & Bookings`;

    try {
      // Create the sheet first
      const createResponse = await gapi.client.sheets.spreadsheets.create({
        properties: {
          title: sheetTitle,
        },
        sheets: [
          {
            properties: {
              title: "Bookings",
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
          {
            properties: {
              title: "Keywords",
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
          {
            properties: {
              title: "Logs",
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      });

      if (!createResponse.result || !createResponse.result.spreadsheetId) {
        throw new Error("Invalid response from sheet creation");
      }

      const spreadsheetId = createResponse.result.spreadsheetId;

      // Add headers to Bookings sheet
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Bookings!A1:M1",
        valueInputOption: "RAW",
        resource: {
          values: [
            [
              "Confirmation Notes",
              "Name of Podcast",
              "Link to Podcast",
              "Name of Host",
              "Avg Listeners per Episode",
              "Monthly Listeners",
              "Followers Count",
              "Email",
              "Phone Number",
              "Date Booked",
              "Time Booked (CST)",
              "Link to Login to Interview",
              "Notes",
            ],
          ],
        },
      });

      // Add headers to Keywords sheet
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Keywords!A1:C1",
        valueInputOption: "RAW",
        resource: {
          values: [["Keyword", "Type", "Relevance"]],
        },
      });

      // Add headers to Logs sheet and first log entry
      await Promise.all([
        gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: "Logs!A1:B1",
          valueInputOption: "RAW",
          resource: {
            values: [["Date/Time", "Event"]],
          },
        }),
        gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: "Logs!A2:B2",
          valueInputOption: "RAW",
          resource: {
            values: [[new Date().toLocaleString(), "Sheet created"]],
          },
        }),
      ]);

      return createResponse.result;
    } catch (error) {
      console.error("Sheet creation error:", error);
      throw error;
    }
  }

  dispatchError(message, error) {
    this.dispatchEvent(
      new CustomEvent("greater-error", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: new Date().toISOString(),
          component: "greater-create-sheet",
          type: "ERROR",
          message,
          technical: error.message,
          stack: error.stack,
          critical: false,
        },
      }),
    );
  }

  render() {
    if (!this.apiReady) {
      return html`
        <div class="mt-8 text-slate-600">Initializing Google Sheets API...</div>
      `;
    }

    if (this.sheetCreated) {
      return html`
        <div class="mt-8">
          <a
            href="${this.sheetUrl}"
            target="_blank"
            class="text-blue-600 hover:text-blue-800"
          >
            Open sheet for ${this.guestName}
          </a>
          <div class="content"></div>
        </div>
      `;
    }

    return html`
      <form @submit=${this.handleSubmit} class="mt-8 space-y-6">
        <div>
          <label
            for="guestName"
            class="block text-sm font-medium text-slate-700"
          >
            Please enter a guest name
          </label>
          <input
            type="text"
            id="guestName"
            name="guestName"
            required
            ?disabled=${!this.apiReady}
            class="mt-1 block w-full rounded-md border-slate-300
                                 shadow-sm focus:border-slate-500
                                 focus:ring-slate-500"
          />
        </div>
        <button
          type="submit"
          ?disabled=${this.isLoading || !this.apiReady}
          class="inline-flex justify-center rounded-md border
                             border-transparent bg-slate-900 py-2 px-4 text-sm
                             font-medium text-white shadow-sm hover:bg-slate-800
                             focus:outline-none focus:ring-2 focus:ring-slate-500
                             focus:ring-offset-2 disabled:opacity-50"
        >
          ${this.isLoading ? "Creating sheet..." : "Create Sheet"}
        </button>
      </form>
    `;
  }
}

customElements.define("greater-create-sheet", GreaterCreateSheet);
