class SheetsAPIManager {
  static instance = null;

  constructor() {
    if (SheetsAPIManager.instance) {
      return SheetsAPIManager.instance;
    }
    this.initPromise = null;
    this.DISCOVERY_DOC =
      "https://sheets.googleapis.com/$discovery/rest?version=v4";
    this.REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in ms
    SheetsAPIManager.instance = this;
  }

  static getInstance() {
    if (!SheetsAPIManager.instance) {
      SheetsAPIManager.instance = new SheetsAPIManager();
    }
    return SheetsAPIManager.instance;
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

        // Load both APIs
        await Promise.all([
          gapi.client.load(this.DISCOVERY_DOC),
          gapi.client.load("drive", "v3"),
        ]);

        console.log("Google Sheets API initialized");
        resolve();
      } catch (error) {
        this.initPromise = null; // Clear failed initialization
        reject(new Error(`Failed to initialize Sheets API: ${error.message}`));
      }
    });

    return this.initPromise;
  }

  async waitForReady() {
    try {
      await this.initialize();
      return true;
    } catch (error) {
      console.error("Sheets API initialization failed:", error);
      return false;
    }
  }

  isInitialized() {
    return this.initPromise && this.initPromise.status !== "rejected";
  }

  async canMakeApiCalls() {
    // Check if API is initialized
    if (!this.isInitialized()) {
      return {
        allowed: false,
        reason: "API not initialized",
      };
    }

    // Check if gapi client is available
    if (!window.gapi?.client) {
      return {
        allowed: false,
        reason: "Google API client not available",
      };
    }

    // Check if we have a valid access token
    const token = gapi.client.getToken();
    if (!token) {
      return {
        allowed: false,
        reason: "No access token available",
      };
    }

    // Verify token is not expired
    const currentTime = Date.now();
    if (token.expires_at && token.expires_at < currentTime) {
      return {
        allowed: false,
        reason: "Token expired",
      };
    }

    // All checks passed
    return {
      allowed: true,
      reason: null,
    };
  }
}

export const sheetsManager = new SheetsAPIManager();
