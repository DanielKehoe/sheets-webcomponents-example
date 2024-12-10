# Development Setup Guide

This document provides instructions for setting up the application development environment. It covers all necessary prerequisites, installation steps, and configuration required to start development on the project.

## Development Tooling and Services

### Claude Desktop

Use Claude Desktop. Claude Desktop has an "Artifacts" feature that generates code or documents in a sidebar, ready for export (you download the file) or copy/paste. Use Claude Desktop with the Anthropic MCP (Model Context Protocol) integrations. Here's a [curated list of MCP servers](https://github.com/wong2/awesome-mcp-servers). I use the [Filesystem MCP server](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) and the [Git MCP server](https://github.com/modelcontextprotocol/servers/tree/main/src/git). Here's an article that shows how to [Set up the Claude Desktop configuration file for Anthropic MCP Model Context Protocol](https://medium.com/demohub-tutorials/6-steps-using-mcp-to-integrate-claude-desktop-with-external-tools-26398c7a4287).

### Claude Pro

You'll need to sign up for a Claude Pro subscription ($20/month). Claude Pro has a Projects feature, which means you save a set of conversations for review, or come back and add to them later, keeping a context available for further work. Claude Pro lets you import files to save as Project Knowledge, which lets you maintain a larger and more complete context for any set of conversations. After you create a project for this application, add Project Knowledge content from this repository. Import each file listed in the `docs/directory_structure.md` file. This will give you a complete context for the project, most importantly the directory structure itself, the functional specifications, and the engineering decision records. Also add the CHANGELOG so you can instruct Claude to add to the CHANGELOG at each step of the development process. In theory, Claude could reproduce the entire application from the CHANGELOG and the files in the `docs` folder.

Claude Pro provides more usage than the free version. However, one drawback of Claude Pro remains its usage limit. Typically, you can work for 3-4 hours before you encounter its usage ceiling. It will refuse further requests for about 3-4 hours. During that time, if you want to continue working, you'll have to use an AI-assisted editor such as [Cursor](https://www.cursor.com/) or [Zed](https://zed.dev/), use ChatGPT, or switch to a less-powerful model such as Claude Haiku. Alternatively, try direct API access to Claude models using an application such as [Msty](https://msty.app/) and {OpenRouter](https://openrouter.ai/). Note that if you switch away from Claude Desktop during a usage hiatus, you must restore the Claude LLM context by removing and relaoding any files that you have changed.

### Claude 3.5 Sonnet

I used the Claude 3.5 Sonnet model for this project. Claude 3.5 Sonnet is a powerful model that can generate code, documents, and other artifacts. Other LLMs are good at coding and application architecture, but Claude 3.5 Sonnet is available in the Claude Desktop, and the Claude Desktop has the best interface for managing a project.

### Cursor

Use Cursor. You'll need a code editor, and Cursor is built on the familiar VS Code interface with integrated AI assistance. If you are familiar with VS Code, you will be comfortable with Cursor. Cursor provides a sidebar AI chat window, next to the main file-focused code editor window. You can chat with various LLMs (including Claude Sonnet 3.5) and the chat will produce generated code in the chat window for copying and pasting. More usefully, the AI chat window now has a Composer mode that will generate new files in a project folder and inject proposed inline code changes in the open file in the main editor window. As a user, you can click checkboxes to accept changes line-by-line or all at once. This is the most efficient integration of AI with a code editor because it eliminates the need to copy and paste code snippets.

In theory, you can use Cursor alone without Claude Desktop. However, I find that Claude Desktop provides a better interface for managing the project. The conversational interface in Claude Desktop helps me approach the project as a series of tasks to execute in sequence. The Anthropic MCP servers provide a way to integrate Claude Desktop with external tools, such as Git and the filesystem, so that I can change the project files either from Claude Desktop or from Cursor. Note however that if you change the project files from Cursor, you will need to reload the files in Claude Desktop to maintain the context.


## Prerequisites

- Node.js (latest LTS version)
- Google Cloud Platform account
- Cloudflare account
- Git

## Google Cloud Platform Setup

1. Create a new project in Google Cloud Console
2. Enable required APIs:
   - Google Sheets API
   - Cloud Natural Language API
3. Create OAuth 2.0 credentials:
   - Set up OAuth consent screen
   - Create OAuth 2.0 Client ID
   - Create API Key
   - Add authorized JavaScript origins for your development environment

## Cloudflare Setup

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```
2. Log in to Cloudflare:
   ```bash
   wrangler login
   ```
3. Configure Worker secrets:
   ```bash
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_API_KEY
   ```

## Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ~/workspace/greater-agency
   ```

2. Install development dependencies:
   ```bash
   cd src/workers/sheets-example/sheets-example
   npm install
   ```

3. Start local development server:
   ```bash
   wrangler dev
   ```

## Testing

Run the test suite:
```bash
npm test
```

## Troubleshooting

Common issues and their solutions will be added here as they are encountered.
