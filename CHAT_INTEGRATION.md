# Chat Integration for Promptitude

This document explains the newly implemented chat participant functionality that allows you to interact with your synced prompts through VS Code's chat interface.

## Features

The chat integration provides the following capabilities:

### 🤖 Chat Participant

A dedicated chat participant `@prompts` that you can interact with in VS Code's chat panel.

### 📋 Available Commands

- **`@prompts help`** - Show comprehensive help information
- **`@prompts list`** - List all available prompts grouped by category
- **`@prompts sync`** - Sync prompts from your configured repositories
- **`@prompts search <term>`** - Search prompts by name, description, or tags
- **`@prompts categories`** - Show prompts grouped by categories with counts

### 🎯 Key Capabilities

1. **Smart Prompt Management**
   - Automatic caching of synced prompts
   - Cache refreshes every 5 minutes or on-demand
   - Parses YAML frontmatter for rich metadata

2. **Rich Prompt Metadata**
   - Name and description
   - Author information
   - Category classification (chatmode, instruction, prompt, other)
   - Tags for better organization
   - Version tracking
   - Source repository information

3. **Interactive Chat Interface**
   - Natural language command processing
   - Markdown-formatted responses
   - Follow-up suggestions
   - Progress indicators during sync

## Usage

### Getting Started

1. **Open the Chat Panel**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
   - Type "Chat" and select "Open Chat"
   - Or use the keyboard shortcut (varies by VS Code configuration)

2. **Invoke the Prompts Participant**
   - In the chat input, type `@prompts`
   - Then type your command or question

### Example Interactions

```
@prompts help
```
Shows detailed help information about available commands and features.

```
@prompts list
```
Lists all your synced prompts organized by category with emojis.

```
@prompts sync
```
Syncs prompts from your configured repositories and updates the cache.

```
@prompts search code review
```
Searches for prompts containing "code review" in their name, description, or tags.

```
@prompts categories
```
Shows a summary of prompts grouped by category.

## Prompt File Format

To enhance your prompts with metadata for better integration, use YAML frontmatter:

```markdown
---
name: "Code Review Expert"
description: "Helps with thorough code reviews"
author: "Your Name"
category: "prompt"
tags: ["code-review", "best-practices", "quality"]
version: "1.0"
---

You are an expert code reviewer. When reviewing code, you should...
[Your prompt content here]
```

### Frontmatter Fields

- **name**: Display name for the prompt (defaults to filename)
- **description**: Brief description of what the prompt does
- **author**: Creator of the prompt
- **category**: One of: `chatmode`, `instruction`, `prompt`, or `other`
- **tags**: Array of tags for categorization and search
- **version**: Version number for tracking changes

## Architecture

### Components

1. **ChatParticipantManager** (`src/chatParticipant.ts`)
   - Main coordinator for chat interactions
   - Manages prompt cache and refresh logic
   - Handles command routing and responses

2. **PromptParser** (`src/promptParser.ts`)
   - Parses prompt files with YAML frontmatter
   - Extracts metadata and content
   - Handles source tracking information

3. **PromptMetadata** (`src/promptMetadata.ts`)
   - Type definitions for prompt metadata
   - Configuration interfaces

4. **SimpleYamlParser** (`src/utils/yamlParser.ts`)
   - Lightweight YAML parser for frontmatter
   - Handles strings, numbers, booleans, and arrays

### Cache Management

The chat participant maintains an in-memory cache of prompts:

- **Cache Duration**: 5 minutes
- **Auto-refresh**: When needed during completions
- **Manual Refresh**: Via `promptitude.chat.refreshCache` command
- **Sync Integration**: Automatically refreshes after successful sync

### Source Tracking

When files are synced, the system adds a source comment:

```html
<!-- Source: owner/repo/path/to/file.md (branch: main) -->
```

This allows the chat participant to display source information for each prompt.

## Configuration

### VS Code Settings

While the chat integration works out of the box, you can customize the behavior through existing settings:

- `promptitude.repositories` - Configure which repositories to sync from
- `promptitude.syncChatmode` - Enable/disable syncing of chatmode files
- `promptitude.syncInstructions` - Enable/disable syncing of instruction files
- `promptitude.syncPrompt` - Enable/disable syncing of prompt files
- `promptitude.customPath` - Custom directory for storing prompts

### Commands

New commands added for chat integration:

- **Promptitude: Refresh Prompt Cache** - Manually refresh the prompt cache

## Technical Details

### Cache Architecture

```
┌─────────────────────────────────────┐
│     ChatParticipantManager          │
│  ┌──────────────────────────────┐   │
│  │    promptCache (Map)         │   │
│  │  - name → PromptMetadata     │   │
│  │  - Auto-expires (5 min)      │   │
│  └──────────────────────────────┘   │
│              ↓                       │
│     PromptParser                     │
│  ┌──────────────────────────────┐   │
│  │  - Parse YAML frontmatter    │   │
│  │  - Extract source info       │   │
│  │  - Generate descriptions     │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Prompt Discovery

1. Reads from configured prompts directory
2. Finds all `.md` and `.txt` files
3. Parses each file for frontmatter
4. Extracts source information from HTML comments
5. Builds cache with full metadata

### Error Handling

- Graceful degradation if chat API is unavailable
- Continues extension activation even if chat init fails
- Logs warnings but doesn't block core functionality
- Individual file parsing errors don't stop cache building

## Future Enhancements

Potential improvements for future versions:

1. **Language Model Tools**
   - Register prompts as callable LM tools
   - Direct integration with Copilot requests

2. **Prompt Templates**
   - Support for parameterized prompts
   - Variable substitution in chat

3. **Collaborative Features**
   - Share prompts with team members
   - Prompt usage analytics

4. **Advanced Search**
   - Fuzzy search
   - Regular expression support
   - Multi-field filtering

5. **Prompt Collections**
   - Group related prompts
   - Workspace-specific prompt sets

## Troubleshooting

### Chat Participant Not Appearing

1. Check that you're using VS Code version 1.70.0 or later
2. Verify the extension is activated: Check Output panel → Promptitude
3. Look for errors in the Developer Console (`Help > Toggle Developer Tools`)

### Prompts Not Showing Up

1. Ensure repositories are configured in settings
2. Run `@prompts sync` to sync from repositories
3. Check that files are in the correct directory
4. Run `@prompts list` to verify cache contents

### Cache Issues

1. Run command: `Promptitude: Refresh Prompt Cache`
2. Check the Output panel for error messages
3. Verify prompts directory exists and contains files

### Parsing Errors

1. Validate YAML frontmatter syntax
2. Ensure frontmatter is wrapped in `---` markers
3. Check for special characters in field values
4. Use quotes around strings with special characters

## Development

### Adding New Commands

To add a new chat command:

1. Add handler case in `handleChatRequest` method
2. Implement the command handler method
3. Update the help text in `showHelp` method
4. Add to package.json `chatParticipants` commands array

### Extending Metadata

To add new metadata fields:

1. Update `PromptMetadata` interface
2. Modify `PromptParser.createPromptMetadata`
3. Update YAML parser if needed
4. Update documentation display methods

### Testing

Test the integration:

```bash
# Compile the extension
npm run compile

# Run in Extension Development Host
# Press F5 in VS Code or use "Run Extension" in Debug panel
```

## Resources

- [VS Code Chat API Documentation](https://code.visualstudio.com/api/extension-guides/chat)
- [Extension Contribution Points](https://code.visualstudio.com/api/references/contribution-points)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)

## Support

For issues or questions:

1. Check the [GitHub Issues](https://github.com/nventive/promptitude/issues)
2. Review the Output panel (Promptitude channel) for logs
3. Enable debug mode in settings for verbose logging
4. Create a new issue with reproduction steps

## License

This chat integration is part of the Promptitude extension and follows the same license as the main project.
