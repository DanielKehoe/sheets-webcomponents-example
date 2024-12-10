import {
  LitElement,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class SheetsExample extends LitElement {
  static properties = {
    isLoading: { type: Boolean },
    isAuthenticated: { type: Boolean },
    hasError: { type: Boolean },
    pendingMount: { type: Boolean },
  };

  constructor() {
    super();
    this.isLoading = true;
    this.isAuthenticated = false;
    this.hasError = false;
    this.pendingMount = false;
  }

  async firstUpdated() {
    console.log("First render complete, Shadow DOM ready");
    if (this.pendingMount) {
      console.log("Processing pending mount");
      await this.mountCreateSheetComponent();
      this.pendingMount = false;
    }
  }

  updated(changedProperties) {
    if (changedProperties.has("pendingMount") && this.pendingMount) {
      console.log("PendingMount changed, attempting mount");
      this.mountCreateSheetComponent();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.waitForGoogleLibraries();
  }

  async waitForGoogleLibraries() {
    try {
      // Wait for both libraries to be available
      await new Promise((resolve) => {
        const checkLibraries = () => {
          if (window.gapi && window.google) {
            resolve();
          } else {
            setTimeout(checkLibraries, 100);
          }
        };
        checkLibraries();
      });

      // Now initialize auth
      await this.initializeGoogleAuth();
    } catch (error) {
      console.error("Failed to load Google libraries:", error);
      this.dispatchError("Failed to load Google libraries", error);
      this.isLoading = false;
      this.hasError = true;
    }
  }

  async initializeGoogleAuth() {
    try {
      console.log("Initializing Google Auth...");

      // Get client ID from our API
      const response = await fetch("/api/config");
      if (!response.ok) {
        throw new Error(`Config fetch failed: ${response.status}`);
      }

      const { clientId } = await response.json();

      if (!clientId) {
        throw new Error("No client ID in config response");
      }

      console.log("Got client ID:", clientId);

      // Initialize Google APIs
      await new Promise((resolve) => gapi.load("client", resolve));
      console.log("GAPI client loaded");

      // Initialize token client with ALL required scopes
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: [
          "https://www.googleapis.com/auth/spreadsheets",
          "https://www.googleapis.com/auth/drive",
          "https://www.googleapis.com/auth/drive.file",
          "https://www.googleapis.com/auth/drive.metadata",
          "https://www.googleapis.com/auth/cloud-platform",
        ].join(" "),
        callback: async (response) => {
          if (response.error !== undefined) {
            throw response;
          }

          try {
            // Store the token
            this.accessToken = response.access_token;

            // Initialize gapi client with the token
            await gapi.client.init({
              discoveryDocs: [
                "https://sheets.googleapis.com/$discovery/rest?version=v4",
                "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
              ],
            });

            gapi.client.setToken({
              access_token: response.access_token,
            });

            this.isAuthenticated = true;
            this.pendingMount = true; // Set pending mount instead of immediate mounting
          } catch (error) {
            console.error("Post-authentication setup failed:", error);
            this.dispatchError(
              "Failed to complete authentication setup",
              error,
            );
            this.hasError = true;
          } finally {
            this.isLoading = false;
            this.requestUpdate();
          }
        },
      });

      console.log("Auth initialization complete");
      this.isLoading = false;
    } catch (error) {
      console.error("Auth initialization error:", error);
      this.dispatchError("Failed to initialize Google Auth", error);
      this.isLoading = false;
      this.hasError = true;
    }
  }

  async mountCreateSheetComponent() {
    console.log("Attempting to mount greater-create-sheet component");

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

      // Clear any existing content
      contentDiv.innerHTML = "";

      // Create component
      let createSheet;
      try {
        createSheet = document.createElement("greater-create-sheet");
        if (!createSheet) {
          throw new Error("Failed to create greater-create-sheet element");
        }
      } catch (error) {
        throw new Error(`Component creation failed: ${error.message}`);
      }

      // Verify component was defined
      if (!customElements.get("greater-create-sheet")) {
        throw new Error("greater-create-sheet component is not registered");
      }

      // Mount component
      try {
        contentDiv.appendChild(createSheet);
        console.log("greater-create-sheet component mounted successfully");
      } catch (error) {
        throw new Error(`Component mounting failed: ${error.message}`);
      }

      // Verify mounting
      if (!contentDiv.contains(createSheet)) {
        throw new Error("Component mount verification failed");
      }
    } catch (error) {
      console.error("Component mounting error:", error);
      this.dispatchError(
        "Failed to initialize sheet creation interface",
        error,
        true,
      );
      this.hasError = true;
      throw error;
    }
  }

  async handleAuthClick() {
    if (!this.tokenClient) {
      this.dispatchError(
        "Authentication not ready",
        new Error("Token client not initialized"),
        true,
      );
      return;
    }

    try {
      // Force new consent prompt to ensure all scopes are granted
      this.tokenClient.requestAccessToken({
        prompt: "consent",
      });
    } catch (error) {
      console.error("Authentication failed:", error);
      this.dispatchError("Authentication failed", error, true);
      this.hasError = true;
    }
  }

  dispatchError(message, error, critical = false) {
    this.dispatchEvent(
      new CustomEvent("greater-error", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: new Date().toISOString(),
          component: "sheets-example",
          type: "ERROR",
          message,
          technical: error.message,
          stack: error.stack,
          critical,
        },
      }),
    );
  }

  render() {
    if (this.isLoading) {
      return html`
        <div class="flex justify-center items-center min-h-screen">
          <p class="text-slate-600">Loading authentication...</p>
        </div>
      `;
    }

    if (!this.isAuthenticated) {
      return html`
        <div class="flex justify-center items-center min-h-screen">
          <button
            @click=${this.handleAuthClick}
            class="bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            ?disabled=${this.hasError}
          >
            Sign in with Google
          </button>
        </div>
      `;
    }

    return html`
      <div class="min-h-screen flex flex-col items-center py-8">
        <div class="max-w-xl w-full px-4">
          <h1 class="text-3xl font-bold text-slate-900 mb-8 text-center">
            sheets-webcomponents-example
          </h1>
          <div class="content"></div>
        </div>
      </div>
    `;
  }
}

customElements.define("sheets-example", SheetsExample);
