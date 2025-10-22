# Migration Guide - Chat Integration Update

## Overview

This guide helps you migrate to the new version of Promptitude that includes chat participant functionality.

## What's New?

### ✨ Major Features

1. **Chat Participant Integration**
   - Interact with prompts via `@prompts` in VS Code chat
   - Commands: help, list, sync, search, categories
   - Rich markdown responses with emojis and formatting

2. **YAML Frontmatter Support**
   - Add metadata to your prompts
   - Fields: name, description, author, category, tags, version
   - Automatic parsing and display

3. **Source Tracking**
   - Synced files now include source repository information
   - HTML comments with repo/branch/path details
   - Displayed in chat interactions

4. **Smart Caching**
   - In-memory prompt cache (5-minute expiry)
   - Auto-refresh on sync
   - Manual refresh command available

## Upgrading

### Step 1: Install the New Version

1. Download the new `.vsix` file
2. Open VS Code
3. Command Palette → "Extensions: Install from VSIX"
4. Select the new file
5. Reload VS Code when prompted

### Step 2: Verify Installation

Check that the chat participant is available:

1. Open chat panel
2. Type `@prompts`
3. Should see the participant appear in autocomplete

### Step 3: Initial Sync

Sync your repositories to add source tracking:

```
Command Palette → "Promptitude: Sync Now"
```

Or via chat:
```
@prompts sync
```

This will:
- Re-download all prompts
- Add source tracking comments
- Build initial cache

## For Existing Users

### Your Settings Are Preserved

All existing settings remain unchanged:
- Repository configurations
- Sync frequency
- Custom paths
- Notification preferences
- Azure DevOps PATs

### Existing Prompts Still Work

Your current prompts will continue to work as-is:
- No frontmatter required
- Backward compatible
- Automatically generates descriptions

### What You'll Notice

1. **Source Comments**: Synced files now have HTML comments at the top
   ```html
   <!-- Source: owner/repo/path (branch: main) -->
   ```

2. **Chat Commands**: New way to interact with prompts
   ```
   @prompts list
   @prompts search term
   ```

3. **No Breaking Changes**: Everything else works exactly as before

## Enhancing Your Prompts

### Adding Frontmatter (Optional)

To take advantage of chat features, add YAML frontmatter to your prompts:

**Before:**
```markdown
You are a code review expert...
```

**After:**
```markdown
---
name: "Code Review Expert"
description: "Performs thorough code reviews"
category: "prompt"
tags: ["code-review", "quality"]
---

You are a code review expert...
```

### Recommended Metadata

**Minimal** (good):
```yaml
---
name: "My Prompt"
description: "What it does"
---
```

**Complete** (best):
```yaml
---
name: "My Prompt"
description: "What it does"
author: "Team Name"
category: "prompt"
tags: ["tag1", "tag2"]
version: "1.0.0"
---
```

### Category Values

Use these standard categories:
- `chatmode` - For chat modes (💬)
- `instruction` - For instructions (📖)
- `prompt` - For regular prompts (💡)
- `other` - For uncategorized (📄)

## Repository Maintainers

### Updating Your Repository

If you maintain a prompt repository:

1. **Add Frontmatter to Existing Prompts**
   ```bash
   # For each prompt file, add YAML frontmatter
   ```

2. **Organize by Category**
   ```
   prompts/
   ├── chatmode/      # Chat mode prompts
   ├── instructions/  # Instruction prompts
   └── prompt/        # Regular prompts
   ```

3. **Document Metadata Format**
   - Create a README in your repo
   - Explain required/optional fields
   - Provide examples

4. **Maintain Consistency**
   - Use consistent tag naming
   - Follow category conventions
   - Keep descriptions concise

### Example Repository Structure

```
your-prompts-repo/
├── README.md
├── prompts/
│   ├── chatmode/
│   │   └── expert-mode.md
│   ├── instructions/
│   │   └── coding-standards.md
│   └── prompt/
│       ├── code-review.md
│       └── documentation.md
└── CONTRIBUTING.md
```

**Example Prompt File:**
```markdown
---
name: "Code Review Expert"
description: "Performs comprehensive code reviews"
author: "DevOps Team"
category: "prompt"
tags: ["code-review", "best-practices", "quality"]
version: "1.0.0"
---

You are an expert code reviewer with 15+ years of experience...

[Rest of your prompt content]
```

## Testing Your Migration

### 1. Verify Chat Participant

```
@prompts help
```
Should show comprehensive help information.

### 2. Check Prompt Loading

```
@prompts list
```
Should show all your prompts with metadata.

### 3. Test Search

```
@prompts search code
```
Should find prompts containing "code".

### 4. Verify Categories

```
@prompts categories
```
Should show category breakdown.

### 5. Test Sync

```
@prompts sync
```
Should sync and refresh cache.

## Troubleshooting

### Chat Participant Not Appearing

**Symptoms:**
- `@prompts` doesn't autocomplete
- No response in chat

**Solutions:**
1. Reload VS Code window
   ```
   Command Palette → "Developer: Reload Window"
   ```

2. Check Output panel
   ```
   View → Output → Select "Promptitude"
   ```

3. Look for errors in console
   ```
   Help → Toggle Developer Tools
   ```

### Prompts Not Showing in Chat

**Symptoms:**
- `@prompts list` shows empty or few prompts

**Solutions:**
1. Refresh cache manually
   ```
   Command Palette → "Promptitude: Refresh Prompt Cache"
   ```

2. Re-sync repositories
   ```
   @prompts sync
   ```

3. Check prompts directory
   ```
   Command Palette → "Promptitude: Open Prompts Folder"
   ```

### Source Comments Missing

**Symptoms:**
- Synced files don't have source comments

**Solutions:**
1. Re-sync after upgrading
   ```
   Command Palette → "Promptitude: Sync Now"
   ```

2. Verify new version installed
   ```
   Extensions → Promptitude → Check version
   ```

### Frontmatter Not Parsed

**Symptoms:**
- Metadata doesn't appear in chat
- Using generated descriptions instead

**Solutions:**
1. Check YAML syntax
   ```yaml
   ---
   name: "Valid Name"
   description: "Valid description"
   ---
   ```

2. Ensure proper delimiters (three dashes)

3. Verify file has `.md` or `.txt` extension

4. Refresh cache after fixing
   ```
   Command Palette → "Promptitude: Refresh Prompt Cache"
   ```

## Rollback Instructions

If you need to revert to the previous version:

1. **Uninstall Current Version**
   - Extensions → Promptitude → Uninstall

2. **Install Previous Version**
   - Install previous `.vsix` file
   - Or reinstall from marketplace

3. **Clean Up (Optional)**
   ```bash
   # Remove source comments from prompts
   # This is optional - they don't affect functionality
   ```

4. **Reload VS Code**

## Support

### Getting Help

1. **Check Documentation**
   - [CHAT_INTEGRATION.md](./CHAT_INTEGRATION.md)
   - [QUICK_START.md](./QUICK_START.md)
   - [EXAMPLE_PROMPTS.md](./EXAMPLE_PROMPTS.md)

2. **Enable Debug Logging**
   ```
   Settings → Promptitude: Debug → Enable
   ```

3. **Check Logs**
   ```
   View → Output → Promptitude
   ```

4. **Report Issues**
   - GitHub Issues with:
     - Extension version
     - VS Code version
     - Operating system
     - Steps to reproduce
     - Relevant logs

## FAQ

### Q: Do I need to update my existing prompts?

**A:** No. Existing prompts work as-is. Frontmatter is optional and enhances the experience but isn't required.

### Q: Will this affect my current workflows?

**A:** No. All existing functionality remains unchanged. The chat integration is an additional feature.

### Q: Can I disable the chat participant?

**A:** Yes. While there's no dedicated setting, you can simply not use `@prompts` in chat. It won't affect other extension functionality.

### Q: What happens to prompts without frontmatter?

**A:** The system automatically generates descriptions from the first line of content. They'll still appear in chat with a default "other" category.

### Q: How do I update repository URLs?

**A:** No changes needed. The format remains the same:
```
https://github.com/org/repo
https://github.com/org/repo|branch
```

### Q: Are Azure DevOps repositories supported?

**A:** Yes. Full support continues with the same authentication method.

### Q: How often does the cache refresh?

**A:** Automatically every 5 minutes, or:
- After running sync
- When manually refreshed via command
- On extension activation

### Q: Can I customize the cache duration?

**A:** Not currently. The 5-minute duration is optimized for performance and freshness. Future versions may make this configurable.

## Best Practices

### For Users

1. **Try the Chat Features**
   - Explore with `@prompts help`
   - Use `@prompts search` to find prompts
   - Check categories with `@prompts categories`

2. **Keep Prompts Organized**
   - Use descriptive filenames
   - Add frontmatter for better discovery
   - Tag prompts appropriately

3. **Stay Updated**
   - Sync regularly
   - Check for extension updates
   - Review changelog for new features

### For Repository Maintainers

1. **Add Metadata Gradually**
   - Start with name and description
   - Add categories and tags over time
   - Keep frontmatter consistent

2. **Document Your Format**
   - Explain required fields in repo README
   - Provide template files
   - Share examples

3. **Maintain Quality**
   - Review prompts before committing
   - Use version numbers
   - Update descriptions when changing prompts

## Next Steps

1. **Explore Chat Integration**
   - Try all `@prompts` commands
   - Search for existing prompts
   - Discover features through help

2. **Enhance Your Prompts**
   - Add frontmatter to key prompts
   - Organize by category
   - Use descriptive tags

3. **Share Feedback**
   - Report issues
   - Suggest improvements
   - Share use cases

## Resources

- [Chat Integration Documentation](./CHAT_INTEGRATION.md)
- [Quick Start Guide](./QUICK_START.md)
- [Example Prompts](./EXAMPLE_PROMPTS.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

---

**Questions?** Check the documentation or create an issue on GitHub.

**Happy Prompting! 🎉**
