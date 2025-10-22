# Quick Start Guide - Testing Chat Integration

## 🚀 Getting Started

Follow these steps to test the new chat integration functionality:

## 1. Build and Run the Extension

```bash
# Compile the TypeScript code
npm run compile

# Run the extension in development mode
# Option A: Press F5 in VS Code
# Option B: Use the Debug panel → "Run Extension"
```

This will open a new "Extension Development Host" window with your extension loaded.

## 2. Configure a Test Repository

In the Extension Development Host window:

1. Open Settings (`Cmd/Ctrl + ,`)
2. Search for "Promptitude"
3. Add a repository to `Promptitude: Repositories`:
   ```
   https://github.com/your-org/your-prompt-repo
   ```
   Or use the format with branch:
   ```
   https://github.com/your-org/your-prompt-repo|main
   ```

## 3. Sync Prompts

**Option A: Via Command Palette**
1. Press `Cmd/Ctrl + Shift + P`
2. Type "Promptitude: Sync Now"
3. Press Enter
4. Wait for sync to complete (check status bar)

**Option B: Via Chat (after opening chat)**
1. Open chat panel
2. Type: `@prompts sync`
3. Send the message

## 4. Open the Chat Panel

1. Press `Cmd/Ctrl + Shift + P`
2. Type "Chat: Focus on Chat View" or "Chat"
3. Select the chat command
4. Or look for the chat icon in the Activity Bar (left sidebar)

## 5. Test Chat Commands

Try these commands in the chat input:

### Basic Help
```
@prompts help
```
**Expected**: Shows comprehensive help information with all commands

### List All Prompts
```
@prompts list
```
**Expected**: Shows all synced prompts organized by category (💬 Chat Modes, 📖 Instructions, 💡 Prompts, 📄 Other)

### Search for Prompts
```
@prompts search code
```
**Expected**: Shows prompts that match "code" in name, description, or tags

### View Categories
```
@prompts categories
```
**Expected**: Shows category summary with prompt counts

### Sync from Repositories
```
@prompts sync
```
**Expected**: 
- Progress message "🔄 Starting sync..."
- Success message with item count
- Cache updated message

## 6. Create Test Prompts

To test the YAML frontmatter parsing, create a test prompt file:

### Option A: Manual Creation

1. Find your prompts directory:
   - Mac/Linux: `~/.vscode/prompts/` (or custom path from settings)
   - Windows: `%USERPROFILE%\.vscode\prompts\` (or custom path)

2. Create `test-prompt.md`:
```markdown
---
name: "Test Code Review Prompt"
description: "A test prompt for code review functionality"
author: "Your Name"
category: "prompt"
tags: ["test", "code-review", "example"]
version: "1.0.0"
---

You are an expert code reviewer. Please review the following code for:
- Best practices
- Potential bugs
- Performance improvements
- Security issues

Provide constructive feedback with examples.
```

3. Refresh the cache:
   - Command Palette: `Promptitude: Refresh Prompt Cache`
   - Or in chat: `@prompts sync`

4. Verify it appears:
```
@prompts list
```

### Option B: Via Sync

1. Add the test prompt to your repository
2. Commit and push
3. Run: `@prompts sync`
4. Check: `@prompts list`

## 7. Test Search Functionality

After syncing prompts, test search:

```
@prompts search review
```
Should show prompts with "review" in name/description/tags

```
@prompts search test
```
Should show your test prompt

```
@prompts search nonexistent
```
Should show "No prompts found" message

## 8. Verify Source Tracking

1. Check a synced prompt file in your prompts directory
2. Open it in VS Code
3. Verify it has a source comment at the top:
```html
<!-- Source: owner/repo/path/to/file.md (branch: main) -->
```

4. Run `@prompts list`
5. Verify source information appears in the output

## 9. Test Cache Refresh

### Auto-refresh (5-minute expiry)
1. List prompts: `@prompts list`
2. Wait 6 minutes
3. Search for a prompt: `@prompts search test`
4. Check logs - should show "Refreshing prompt cache..."

### Manual refresh
1. Command Palette: `Promptitude: Refresh Prompt Cache`
2. Should show success message
3. Or use: `@prompts sync` (also refreshes cache)

## 10. Test Error Handling

### No Prompts
1. Delete all files from prompts directory
2. Run: `@prompts list`
3. Should show: "📭 No prompts found"

### Invalid YAML
1. Create prompt with invalid frontmatter:
```markdown
---
name: "Invalid
description: "Missing quote
---
Content
```
2. Run: `@prompts sync` or refresh cache
3. Check Output panel (Promptitude) for warning
4. Prompt should still be loaded with generated description

### Empty Search
1. Run: `@prompts search`
2. Should show: "❓ Please provide a search term"

## 11. Check Logs

View detailed logs:

1. Open Output panel: `View → Output`
2. Select "Promptitude" from dropdown
3. Look for:
   - "Initializing Chat Participant..."
   - "Chat Participant initialized successfully"
   - "Refreshing prompt cache..."
   - "Prompt cache refreshed with X prompts"

Enable debug mode for more details:
1. Settings → `Promptitude: Debug` → Enable
2. Restart extension
3. Check logs again

## 12. Test Follow-up Suggestions

1. Send any command: `@prompts help`
2. Look for follow-up suggestions below the response:
   - 📋 List all prompts
   - 🔄 Sync prompts now
   - ❓ Show help
   - 🔍 Category prompts

## 🐛 Troubleshooting

### Chat Participant Not Showing

**Check:**
1. VS Code version (requires 1.70.0+)
2. Extension activated: Output panel → Promptitude
3. Look for errors in Developer Tools: `Help → Toggle Developer Tools`

**Solution:**
```
# Reload the window
Cmd/Ctrl + Shift + P → "Developer: Reload Window"
```

### Prompts Not Appearing

**Check:**
1. Repository configured in settings
2. Sync completed successfully
3. Files exist in prompts directory
4. Files have `.md` or `.txt` extension

**Solution:**
```
@prompts sync
# Then check
@prompts list
```

### Cache Not Updating

**Solution:**
```
# Command Palette
Promptitude: Refresh Prompt Cache

# Or via chat
@prompts sync
```

### Parsing Errors

**Check:**
1. YAML syntax is valid
2. Frontmatter wrapped in `---`
3. Quotes around strings with special characters

**Example of valid frontmatter:**
```yaml
---
name: "My Prompt"
description: "Does something cool"
tags: ["tag1", "tag2"]
---
```

## 📊 Expected Outputs

### Successful Sync
```
✅ Sync completed successfully!
📥 Updated 5 prompt(s) from your repositories.
💾 Cache updated with 5 total prompts.
```

### List Output
```
## 📚 Available Prompts (5)

### 💡 Prompts

- **#code-review** - Reviews code for best practices `code`, `review`
- **#documentation** - Generates documentation `docs`, `help`

### 💬 Chat Modes

- **#expert-mode** - Expert chat interactions `chat`, `expert`
```

### Search Output
```
## 🔍 Search Results for "code" (2)

### 💡 #code-review

Reviews code for best practices and bugs

**Tags:** `code`, `review`, `quality`
```

## ✅ Success Criteria

Your implementation is working correctly if:

- ✅ Chat participant responds to `@prompts` commands
- ✅ `help` shows comprehensive documentation
- ✅ `list` displays prompts with emojis and metadata
- ✅ `search` filters prompts correctly
- ✅ `sync` updates prompts from repositories
- ✅ `categories` shows organized view
- ✅ Follow-up suggestions appear
- ✅ Source comments in synced files
- ✅ YAML frontmatter parsed correctly
- ✅ Cache refreshes as expected
- ✅ No errors in Output panel

## 🎉 Next Steps

Once basic testing is complete:

1. **Test with Real Prompts**: Sync from actual team repositories
2. **Test Categories**: Verify chatmode, instruction, prompt categories work
3. **Test Complex YAML**: Try different frontmatter configurations
4. **Performance Test**: Sync large repositories (100+ prompts)
5. **Error Recovery**: Test network failures, auth issues, etc.

## 📸 Demo Recording

Consider recording a demo:

1. Open chat panel
2. Type: `@prompts help`
3. Show: `@prompts list`
4. Demonstrate: `@prompts search <term>`
5. Test: `@prompts sync`
6. Review a prompt file showing source comment

## 📚 Additional Resources

- `CHAT_INTEGRATION.md` - Full documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical overview
- Output Panel (Promptitude) - Runtime logs
- Developer Tools Console - Low-level errors

Happy Testing! 🚀
