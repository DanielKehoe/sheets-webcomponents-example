[[2024-12-03]]

I have a website currently deployed on Cloudflare. I want to build a web application using HTML-standard web components (with the Lit library), HTML with Tailwind CSS (as inline Tailwind classes), and Google OAuth to access a Google API. I don't want to use a dedicated backend server but I am comfortable using Cloudflare Workers (in JavaScript) to provide server-side functionality. The app will be named sheets-webcomponents-example and the UI will be implemented as a file 'sheets-example.html' in the root directory of the website. A folder '/assets/scripts' will contain all web component files. 

UI/UX Specifications:
1. Visual Design:
   - Follow Material Design 3 principles
   - Color scheme: 
     * Primary: Tailwind slate-900
     * Secondary: Tailwind blue-600
     * Error: Tailwind red-600
     * Success: Tailwind green-600
   - Typography: Inter font family
   - Consistent 16px base font size
   - Responsive breakpoints: sm(640px), md(768px), lg(1024px)

2. Accessibility:
   - WCAG 2.1 Level AA compliance
   - Proper ARIA labels and roles
   - Keyboard navigation support
   - Minimum contrast ratio 4.5:1
   - Focus indicators for interactive elements
   - Screen reader friendly error messages

3. Responsive Design:
   - Mobile-first approach
   - Fluid typography scaling
   - Flexible grid layout
   - Touch-friendly tap targets (minimum 44x44px)
   - Appropriate input types for mobile
   - No horizontal scrolling on mobile

4. State Management:
   - Loading spinners for all async operations
   - Disabled states for processing buttons
   - Clear visual feedback for all actions
   - Smooth transitions between states
   - Persistent state across page refreshes
   - Progress indicators for multi-step operations

All web components will import LitElement, html, css, from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js". Be sure to implement detailed logging to the console for each step of each operation so we can easily debug.

The first web component we build will manage access to Google APIs using Google OAuth and it will serve to manage the UI and workflow that is displayed in the 'sheets-example.html' page. The component is named 'sheets-example'. Credentials, specifically GOOGLE_CLIENT_ID and GOOGLE_API_KEY, will be set as Cloudflare Workers Secrets and we will need an intermediary API in a Worker that handles all Google API calls, applying the necessary credentials. The Worker will implement proper CORS policies. A "Loading" state message should display during the time we are waiting for the "Google Login" button. On loading the 'sheets-example.html' page, the user will see a "Google Login" button that performs authentication. We must force the "Google Login" button to display in English even if the user is in a non-English locale. Also we must force all Google authentication pop-up windows to appear in English. Any errors will be logged as errors in the JavaScript console and will be passed to a second web component to be displayed as diagnostic error messages to the user on the 'sheets-example.html' page.

Authentication and Security Specifications:
1. Token Management:
   - Implement automatic token refresh when token is about to expire (1 hour lifetime)
   - Store refresh token in memory only, not localStorage
   - Check token expiry before each API call
   - Redirect to login flow if token refresh fails

2. Session Management:
   - Session duration matches Google's OAuth token lifetime
   - Implement signOut() method to clear tokens and reset UI
   - Use gapi.auth2.getAuthInstance().isSignedIn.listen() for session persistence

3. OAuth Error Handling:
   - Handle specific error scenarios:
     * User cancellation
     * Network errors
     * Invalid client configuration
     * Permission denied
   - Maximum 3 retry attempts for network-related failures
   - Clear partial auth state on failure

4. Required OAuth Scopes:
   - https://www.googleapis.com/auth/spreadsheets
   - https://www.googleapis.com/auth/cloud-platform
   - https://www.googleapis.com/auth/cloud-language

The second web component we build will collect errors from other web components and display diagnostic error messages to the user on the 'sheets-example.html' page. The component is named 'greater-errors'. The timestamps will be in the user's local time.

Error Handling Specifications:
1. Error Display:
   - Errors shown in a dismissible toast/banner at the top of the page
   - Error messages must include: timestamp, error type, user-friendly description
   - Critical errors shown in red, warnings in yellow
   - Maximum of 3 errors displayed simultaneously
   - Errors auto-dismiss after 30 seconds unless marked critical

2. Error Recovery:
   - Each error type must have a defined recovery action
   - Authentication errors: redirect to login
   - API quota errors: display retry countdown
   - Network errors: automatic retry with exponential backoff
   - Invalid input errors: highlight field and show correction guidance

3. API Call Handling:
   - Timeout set to 30 seconds for all API calls
   - Implement retry strategy:
     * Maximum 3 retries
     * Exponential backoff starting at 2 seconds
     * Only retry on 5xx errors and network failures
   - Rate limiting: maximum 5 requests per second per user

4. Error Logging:
   - All errors logged to Google Sheet's Logs tab
   - Error log format: [Timestamp] [Component] [Error Type]: Message
   - Include stack trace for unexpected errors
   - Redact sensitive information before logging

Error Communication Specifications:
1. Event-Based Communication:
   - Use CustomEvent named 'greater-error'
   - Set bubbles: true for DOM propagation
   - Set composed: true for Shadow DOM crossing
   - No direct component coupling required

2. Error Event Detail:
   - timestamp: ISO string
   - component: source component name
   - type: 'ERROR' or 'WARN'
   - message: user-friendly description
   - technical: original error message
   - stack: error stack trace if available
   - critical: boolean for auto-dismiss control

3. Error Reception:
   - greater-errors listens at window level
   - Maintains queue of max 3 visible errors
   - Auto-dismisses non-critical after 30s
   - Logs all errors to console
   - Critical errors require user dismissal

4. Implementation Example:
   ```javascript
   // Sending errors (any component):
   this.dispatchEvent(new CustomEvent('greater-error', {
     bubbles: true,
     composed: true,
     detail: {
       timestamp: new Date().toISOString(),
       component: this.tagName.toLowerCase(),
       type: 'ERROR',
       message: 'User friendly message',
       technical: error.message,
       stack: error.stack,
       critical: false
     }
   }));

   // Receiving errors (greater-errors):
   window.addEventListener('greater-error', 
     (event) => this.handleError(event.detail));
   ```

Sheet ID Communication Specifications:
1. Event-Based Notification:
   - Use CustomEvent named 'greater-sheet-created'
   - Dispatch from greater-create-sheet component
   - Include sheet ID and name in detail
   - Bubble through DOM for any listener

2. Sheet ID Storage:
   - Store in sessionStorage for persistence
   - Key: 'greater-current-sheet-id'
   - Value: JSON containing:
     * id: sheet ID
     * name: guest name
     * created: timestamp

3. Sheet ID Access:
   - Components check sessionStorage first
   - Fall back to listening for creation event
   - Clear storage on page unload/refresh
   - Validate ID before using

4. Implementation Example:
   ```javascript
   // Sending (greater-create-sheet):
   const sheetData = {
     id: response.spreadsheetId,
     name: guestName,
     created: new Date().toISOString()
   };
   sessionStorage.setItem('greater-current-sheet-id', 
     JSON.stringify(sheetData));
   this.dispatchEvent(new CustomEvent('greater-sheet-created', {
     bubbles: true,
     composed: true,
     detail: sheetData
   }));

   // Receiving (any component):
   function getSheetId() {
     // Try storage first
     const stored = sessionStorage.getItem('greater-current-sheet-id');
     if (stored) return JSON.parse(stored);
     
     // Fall back to waiting for event
     return new Promise(resolve => {
       window.addEventListener('greater-sheet-created', 
         (e) => resolve(e.detail), 
         { once: true });
     });
   }
   ```

The third web component we build will create a Google Sheet and it will be named 'greater-create-sheet'. It will contain the hardcoded DISCOVERY_DOC and SCOPES variables needed for the 'gapi.client.sheets.spreadsheets' API. The web component will appear after successful authentication. It will prompt the user to "Please enter a guest name" with a button to submit. A "Loading" state message should display during the time we are waiting for the sheet to be created. A Google Sheet will be created named "<Guest Name> Lead List & Bookings". It will contain three tabs: "Bookings", "Keywords", "Logs". The Bookings tab will contain a first row with column headers:
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
 "Notes"
 The "Keywords" tab will contain column headers "Keyword", "Type", "Relevance".
The "Logs" tab will contain column headers "Date/Time", "Event".
After creation of the sheet, the  "Logs" tab will get a record with the timestamp and "Created sheet" and the 'sheets-example.html' page will display "Open sheet for `<Guest Name>" with a link to the spreadsheet. Be sure we persist the actual sheet ID from the create response so we can use it in the operation performed by the next web component we build.

Google Sheets Integration Specifications:
1. Sheet Creation and Access:
   - Default sheet permissions: Editor access for anyone with the link
   - Sheet naming convention: "<Guest Name> Lead List & Bookings"
   - Maximum sheets per user: 100
   - Auto-delete unused sheets after 365 days
   - Backup sheets daily to separate storage

2. Sheet Formatting:
   - Column widths auto-sized to content
   - Header row: Bold, background color Tailwind slate-100
   - Date columns: Format as user's local timezone
   - URL columns: Format as clickable links
   - Numbers: Right-aligned
   - Text: Left-aligned
   - Freeze header row

3. Data Management:
   - Maximum 10,000 rows per sheet
   - Auto-sort options for each column
   - Data validation rules for specific columns:
     * Email: Valid email format
     * Phone: International format
     * URLs: Valid URL format
     * Dates: Valid date format
   - Auto-format data on entry

4. Performance:
   - Batch updates for multiple cell changes
   - Cache sheet ID and metadata locally
   - Implement exponential backoff for API requests
   - Maximum 60 requests per minute per user
   - Background refresh for sheet data every 5 minutes

Data Validation Specifications:
1. Guest Name Validation:
   - Required field, cannot be empty
   - Length: 2-50 characters
   - Allowed characters: letters, numbers, spaces, hyphens, apostrophes
   - No leading/trailing whitespace
   - Special characters escaped in sheet name
   - Prevent duplicate sheet names by appending timestamp if needed

2. URL Validation:
   - Required field, cannot be empty
   - Must be valid URL format
   - Maximum length: 2048 characters
   - Must start with http:// or https://
   - Must be publicly accessible
   - Supported content types: text/html, text/plain
   - Maximum response size: 5MB

3. Input Sanitization:
   - Strip HTML tags from all inputs
   - Normalize Unicode characters
   - Convert smart quotes to regular quotes
   - Remove zero-width spaces and other invisible characters
   - Encode special characters before sheet insertion

4. Form Submission:
   - Disable submit buttons while processing
   - Validate all inputs before API calls
   - Show inline validation feedback
   - Clear form after successful submission
   - Maintain input values on validation failure

The fourth web component we build will be named 'greater-fetch-analyze' and it will not appear until after successful creation of a sheet. It will prompt the user with "URL to Fetch". Submission of a URL will make a call to the gapi.client.language.documents.analyzeEntities API and the result will be written to the Logs tab as a record and the page will display "URL fetched and analyzed successfully!". A "Loading" state message should display during the time we are waiting for results. The SCOPES configuration value "https://www.googleapis.com/auth/cloud-platform" will be hard-coded in the  'greater-fetch-analyze' component. Any errors will be written to the Logs tab and passed to the 'greater-errors' component for display to the user.

API Integration Specifications:
1. Rate Limiting and Quotas:
   - Google Sheets API:
     * Maximum 60 requests/minute/user
     * Batch operations when possible
     * Cache frequently accessed data
   - Cloud Natural Language API:
     * Maximum 600 requests/minute/user
     * Maximum document size: 1MB
     * Cache analysis results for 24 hours

2. API Error Handling:
   - Implement circuit breaker pattern:
     * Break after 5 consecutive failures
     * Reset after 60 seconds
   - Handle specific error codes:
     * 429: Implement exponential backoff
     * 403: Refresh authentication
     * 503: Retry with linear backoff
   - Log all API errors with request context

3. Request/Response Management:
   - Request timeouts:
     * Sheets API: 30 seconds
     * Language API: 60 seconds
   - Response compression enabled
   - Keep-alive connections
   - Request debouncing (500ms)
   - Response caching where appropriate

4. Security:
   - All API calls through Cloudflare Worker
   - API keys stored as Worker Secrets
   - Request origin validation
   - Response data sanitization
   - No sensitive data in logs
   - CORS policy: domain only

Logging Specifications:
1. Console Logging:
   - Log levels: DEBUG, INFO, WARN, ERROR
   - Component name prefixed to all logs
   - Timestamps in local timezone
   - Performance metrics for all API calls
   - Stack traces for errors
   - Structured JSON format for complex data

2. Sheet Logging:
   - All events logged to "Logs" tab
   - Format: [Timestamp] [Component] [Event Type]: Description
   - Event types:
     * SHEET_CREATED
     * URL_ANALYZED
     * AUTH_SUCCESS
     * AUTH_FAILURE
     * API_ERROR
   - Maximum 10,000 log entries per sheet
   - Auto-archive logs older than 30 days

3. Error Tracking:
   - Capture error message and stack trace
   - Log API response errors
   - Track error occurrence counts
   - Group similar errors together

Performance Specifications:
1. Loading States:
   - Show loading indicator during authentication
   - Display progress during sheet creation
   - Indicate when URL analysis is in progress

2. Resource Loading:
   - Load web components asynchronously
   - Lazy load Google API client libraries
   - Use CDN for Lit library

3. Basic Optimizations:
   - Debounce form submissions
   - Cache sheet ID after creation
   - Reuse OAuth tokens until expiry

Time Zone Specifications:
1. Display Format:
   - Show all times in user's local timezone
   - Store booking times in CST (America/Chicago)
   - Use 12-hour format with AM/PM
   - Include timezone indicator (e.g., "3:00 PM CST")

2. Time Conversions:
   - Convert user's local time to CST for storage
   - Handle daylight saving time automatically
   - Use ISO 8601 format for internal timestamps
   - Validate time inputs against CST business hours

3. Sheet Time Handling:
   - Format "Time Booked (CST)" column consistently
   - Display creation timestamps in local time
   - Log timestamps include timezone offset
   - Sort dates/times in chronological order

Technical Specifications:
1. Browser Support:
   - Modern browsers only (last 2 versions):
     * Chrome
     * Firefox
     * Safari
     * Edge
   - No IE11 support required
   - Support mobile browsers

2. Security Policies:
   - Content Security Policy:
     * Allow Lit library from jsdelivr.net
     * Allow Google APIs
     * Allow Cloudflare Workers
     * Restrict all other external sources
   - Use HTTPS only
   - Implement SameSite=Strict cookies

3. Dependencies:
   - Lit 3.0+ from CDN
   - Tailwind CSS 3.0+ (inline classes)
   - Google API Client Library
   - No other external dependencies

4. Development:
   - Use ES2020+ features
   - Web Components v1 spec
   - Custom Elements v1 spec
   - Shadow DOM v1 spec