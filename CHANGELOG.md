# Changelog

All notable changes to the project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 2024-12-10
- Added deployment documentation
- Added development setup guide
- Created engineering decisions documentation
- Renamed 'docs/requirements' to 'docs/functional_specifications'
- Added docs/directory_structure file
- Added CHANGELOG
- Updated README

### 2024-12-05
- Improved layout for UI components
- Fixed missing sheet title display in sheet creation success message
- Added proper sheet title property tracking in create-sheet component
- Improved layout with centered content using Tailwind CSS
- Fixed component mounting issues in Shadow DOM
- Improved error handling for component creation and mounting
- Added proper error message cleanup
- Fixed API authentication state handling
- Improved error handling for failed URL fetches

### 2024-12-04

- Fixed Google Sign-in initialization and authentication flow
- Added proper Drive API and Sheets API scope handling
- Updated Drive API initialization in component lifecycle
- Removed redundant duplicate sheet name checking to simplify flow
- Added proper error handling for Google API initialization
- Updated worker CORS handling to fix API access issues
- Fixed token client initialization with correct scopes
- Added OAuth scope configuration for Drive and Sheets APIs
- Added Drive API loading to sheets initialization process
- Fixed error handling in sheet creation process
- Improved error display for authentication failures
- Added content div handling for dynamically added components
- Updated sheet creation to use simplified direct creation flow

### 2024-12-01
- Added OAuth token refresh mechanism with 5-minute threshold
- Added column formatting with standard widths
- Added error clearing mechanism in components
- Added proper error event formatting across components
- Added proper timezone handling for log timestamps
- Added user input validation before API calls
- Added input field disabling during API initialization
- Added loading state indicators during processing
- Improved UI flow by hiding sheet title input after sheet creation
- Added show/hide behavior for URL input after successful fetch
- Fixed spreadsheet link display HTML anchor tag rendering in success message
- Added logging for URL fetch operations
- Added URL fetching functionality with CORS handling in worker
- Added field for URL input after sheet creation
- Improved error handling with specific error types and messages
- Added comprehensive logging system with date/time tracking
- Added event logging tab
- Improved sheet formatting with frozen headers
- Added column headers for tabs
- Implemented multiple tabs and sheet title
- Added validation for sheet title input

### 2024-11-30
- Added success message system with spreadsheet links
- Implemented proper OAuth token handling and callbacks
- Added error handling for sheet creation process
- Implemented sheet creation with Google Sheets API
- Configured Google Cloud Project with necessary API access
- Added English locale enforcement for Google Login
- Implemented Google OAuth sign-in button
- Set up initial Google authentication flow
- Set up OAuth consent screen with required scopes
- Created OAuth Client ID with authorized domains
- Configured Google Cloud Console project with required APIs and credentials
- Added detailed Google Cloud Console setup instructions
- Fixed module loading issues with Lit library
- Created web component using Lit
- Configured basic JavaScript imports
- Added Cloudflare worker route configuration for API endpoints
- Added proper CORS validation with Origin header checks in worker
- Added Cloudflare worker as fetch proxy with CORS
- Added worker route mapping for /api/* endpoints
- Added API testing documentation with curl examples
- Added worker deployment configuration
- Set up initial Cloudflare worker configuration
- Added secure credential storage using Cloudflare Worker Secrets
- Added error page handling with 404 page in Cloudflare
- Configured Cloudflare DNS for the deployment domain
- Organized project structure with assets/scripts
- Created basic directory structure
- Initial project commit
