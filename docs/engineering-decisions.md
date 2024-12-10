# Engineering Decisions Record

This document tracks significant engineering decisions made in the project. Each decision record includes the context at the time of the decision, the decision made, and the reasoning behind it. This documentation helps maintain institutional knowledge and provides context for future development decisions.

## Format

Each decision record follows this format:
* **Date**: When the decision was made
* **Decision**: What was decided
* **Context**: The relevant facts and constraints at the time
* **Consequences**: The expected outcomes and tradeoffs
* **Status**: Current status of the decision (e.g., Accepted, Superseded, Deprecated)

## Decisions

_(Records will be added as engineering decisions are made)_


## Notes

Why are we using GitHub and not GitLab or another version control platform?

Why are we using Google Sheets? As a learning exercise, the Google Sheets API is one of the most commonly used APIs. From a user experience perspective, Google Sheets is a familiar tool for many users, and it provides a simple way to create, edit, and store data. By automating creation and interaction with a Google Sheets, we can use this simple application as a building block for more specialized applications.

Why are we using Google Cloud Platform and not AWS or Azure? Because the prupose of this application is to create and edit Google Sheets, and Google Cloud Platform provides authentication and access to the Google Sheets API.

Why are we using web components instead of a framework like React or Angular? Web components are a standard part of the web platform and can be used without any additional libraries or frameworks. This makes them lightweight and easy to use.

Why do we use the Lit library for web components? Lit is a lightweight library that makes it easier to create web components.

Why are we using server-side code? We are using Cloudflare Workers. We could build the entire application using browser-based (client-side) JavaScript web componengts but that would require hard-coding the Google API key in the client-side code, which is a security risk. By using server-side code, we can keep the API key secure and only expose the necessary functionality to the client.

Why are we deploying to Cloudflare?

Why are we using Cloudflare Workers and not a traditional server? Cloudflare Workers provide a serverless environment that allows us to run code close to the user, reducing latency and improving performance.
