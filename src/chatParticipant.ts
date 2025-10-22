import * as vscode from 'vscode';
import { SyncManager } from './syncManager';
import { ConfigManager } from './configManager';
import { PromptParser } from './promptParser';
import { PromptMetadata, ChatCompletionConfig } from './promptMetadata';
import { Logger } from './utils/logger';
import { FileSystemManager } from './utils/fileSystem';

/**
 * Manages VS Code Chat Participant integration for Promptitude
 */
export class ChatParticipantManager {
    private participant: vscode.ChatParticipant | undefined;
    private promptParser: PromptParser;
    private fileSystem: FileSystemManager;
    private logger: Logger;
    private promptCache: Map<string, PromptMetadata> = new Map();
    private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
    private lastCacheUpdate: number = 0;
    
    private readonly config: ChatCompletionConfig = {
        triggerCharacters: ['#'],
        maxSuggestions: 20,
        enableRichHover: true,
        showContentPreview: true,
        previewLength: 200
    };

    constructor(
        private syncManager: SyncManager,
        private configManager: ConfigManager
    ) {
        this.promptParser = new PromptParser();
        this.fileSystem = new FileSystemManager();
        this.logger = Logger.get('ChatParticipantManager');
    }

    async initialize(context: vscode.ExtensionContext): Promise<void> {
        try {
            this.logger.info('Initializing Chat Participant...');
            
            // Create the chat participant
            this.participant = vscode.chat.createChatParticipant(
                'promptitude.prompts', 
                this.handleChatRequest.bind(this)
            );
            
            // Configure participant properties
            this.participant.iconPath = new vscode.ThemeIcon('file-code');

            // Set up followup provider
            this.participant.followupProvider = {
                provideFollowups: this.provideFollowups.bind(this)
            };

            // Register with context
            context.subscriptions.push(this.participant);
            
            // Load initial prompt cache
            await this.refreshPromptCache();
            
            this.logger.info('Chat Participant initialized successfully');

        } catch (error) {
            this.logger.error('Failed to initialize Chat Participant', error instanceof Error ? error : undefined);
            throw error;
        }
    }

    /**
     * Handle chat requests directed to the participant
     */
    private async handleChatRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        try {
            this.logger.debug(`Handling chat request: "${request.prompt}"`);
            
            // Check for cancellation
            if (token.isCancellationRequested) {
                return;
            }

            // Handle prompt references
            const referencedPrompts = await this.extractReferencedPrompts(request.references);
            
            if (referencedPrompts.length > 0) {
                await this.handlePromptReferences(referencedPrompts, stream);
                return;
            }

            // Handle command-based interactions
            const command = request.prompt.toLowerCase().trim();
            
            switch (true) {
                case command.includes('help'):
                    await this.showHelp(stream);
                    break;
                    
                case command.includes('sync'):
                    await this.handleSyncCommand(stream, token);
                    break;
                    
                case command.includes('list'):
                    await this.listAvailablePrompts(stream);
                    break;
                    
                case command.includes('search'):
                    const searchTerm = command.replace('search', '').trim();
                    await this.searchPrompts(searchTerm, stream);
                    break;
                    
                case command.includes('categories'):
                    await this.showCategories(stream);
                    break;
                    
                default:
                    await this.showDefaultResponse(stream);
                    break;
            }
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            stream.markdown(`❌ **Error:** ${errorMessage}`);
            this.logger.error('Chat request failed', error instanceof Error ? error : undefined);
        }
    }



    /**
     * Filter prompts based on search query
     */
    private filterPrompts(query: string): PromptMetadata[] {
        const lowercaseQuery = query.toLowerCase();
        const prompts = Array.from(this.promptCache.values());
        
        if (!query.trim()) {
            return prompts.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        return prompts
            .filter(prompt => 
                prompt.name.toLowerCase().includes(lowercaseQuery) ||
                prompt.description.toLowerCase().includes(lowercaseQuery) ||
                (prompt.tags && prompt.tags.some(tag => 
                    tag.toLowerCase().includes(lowercaseQuery)
                )) ||
                (prompt.author && prompt.author.toLowerCase().includes(lowercaseQuery))
            )
            .sort((a, b) => {
                // Prioritize name matches over description matches
                const aNameMatch = a.name.toLowerCase().includes(lowercaseQuery);
                const bNameMatch = b.name.toLowerCase().includes(lowercaseQuery);
                
                if (aNameMatch && !bNameMatch) return -1;
                if (!aNameMatch && bNameMatch) return 1;
                
                return a.name.localeCompare(b.name);
            });
    }

    /**
     * Refresh prompt cache if needed
     */
    private async refreshPromptCacheIfNeeded(): Promise<void> {
        const now = Date.now();
        
        if (now - this.lastCacheUpdate > this.cacheExpiry) {
            await this.refreshPromptCache();
        }
    }

    /**
     * Refresh the entire prompt cache
     */
    async refreshPromptCache(): Promise<void> {
        try {
            this.logger.debug('Refreshing prompt cache...');
            
            const promptsDir = this.configManager.getPromptsDirectory();
            
            // Check if directory exists
            if (!(await this.fileSystem.directoryExists(promptsDir))) {
                this.logger.warn(`Prompts directory does not exist: ${promptsDir}`);
                this.promptCache.clear();
                return;
            }

            // Find all prompt files
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(promptsDir, '**/*.{md,txt}')
            );

            // Clear existing cache
            this.promptCache.clear();

            // Parse each file and add to cache
            for (const file of files) {
                try {
                    const prompt = await this.promptParser.parseFromFile(file.fsPath);
                    
                    if (prompt) {
                        this.promptCache.set(prompt.name, prompt);
                    }
                } catch (error) {
                    this.logger.warn(`Failed to parse prompt file ${file.fsPath}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }

            this.lastCacheUpdate = Date.now();
            
            this.logger.info(`Prompt cache refreshed with ${this.promptCache.size} prompts`);
            
        } catch (error) {
            this.logger.error('Failed to refresh prompt cache', error instanceof Error ? error : undefined);
        }
    }

    /**
     * Extract referenced prompts from chat references
     */
    private async extractReferencedPrompts(references: readonly vscode.ChatPromptReference[]): Promise<PromptMetadata[]> {
        const prompts: PromptMetadata[] = [];
        
        for (const reference of references) {
            if (reference.id?.startsWith('promptitude.')) {
                const promptName = reference.id.replace('promptitude.', '');
                const prompt = this.promptCache.get(promptName);
                
                if (prompt) {
                    prompts.push(prompt);
                }
            }
        }
        
        return prompts;
    }

    /**
     * Handle when prompts are referenced in chat
     */
    private async handlePromptReferences(
        prompts: PromptMetadata[], 
        stream: vscode.ChatResponseStream
    ): Promise<void> {
        stream.markdown('## Referenced Prompts\n\n');
        
        for (const prompt of prompts) {
            stream.progress(`Processing prompt: ${prompt.name}`);
            
            stream.markdown(`### ${prompt.name}\n\n`);
            stream.markdown(`${prompt.description}\n\n`);
            
            // Show metadata if available
            const metadata: string[] = [];
            
            if (prompt.author) {
                metadata.push(`**Author:** ${prompt.author}`);
            }
            
            if (prompt.category && prompt.category !== 'other') {
                metadata.push(`**Category:** ${prompt.category}`);
            }
            
            if (prompt.tags && prompt.tags.length > 0) {
                metadata.push(`**Tags:** ${prompt.tags.join(', ')}`);
            }
            
            if (metadata.length > 0) {
                stream.markdown(metadata.join('  \n') + '\n\n');
            }
            
            // Show the prompt content
            stream.markdown('**Content:**\n\n');
            stream.markdown('```markdown\n' + prompt.content + '\n```\n\n');
        }
    }

    /**
     * Show help information
     */
    private async showHelp(stream: vscode.ChatResponseStream): Promise<void> {
        stream.markdown('# Promptitude Chat Integration\n\n');
        stream.markdown('I help you work with your synced prompts from GitHub repositories.\n\n');
        
        stream.markdown('## 🚀 Quick Start\n\n');
        stream.markdown('- Type `#` to see available prompts with autocomplete\n');
        stream.markdown('- Hover over `#promptName` to see detailed information\n');
        stream.markdown('- Reference prompts in your chat messages\n\n');
        
        stream.markdown('## 📋 Available Commands\n\n');
        stream.markdown('| Command | Description |\n');
        stream.markdown('|---------|-------------|\n');
        stream.markdown('| `help` | Show this help message |\n');
        stream.markdown('| `list` | List all available prompts |\n');
        stream.markdown('| `sync` | Sync prompts from repositories |\n');
        stream.markdown('| `search <term>` | Search prompts by name, description, or tags |\n');
        stream.markdown('| `categories` | Show prompts grouped by category |\n\n');
        
        stream.markdown('## ✨ Features\n\n');
        stream.markdown('- 🔍 **Smart Autocomplete**: Type `#` to see prompts with descriptions\n');
        stream.markdown('- 📖 **Rich Hover**: Hover for detailed prompt information\n');
        stream.markdown('- 🏷️ **Tag-based Search**: Find prompts by tags during autocomplete\n');
        stream.markdown('- 📁 **Category Icons**: Visual indicators for different prompt types\n');
        stream.markdown('- 🔄 **Auto-sync**: Prompts stay up-to-date with your repositories\n\n');
        
        stream.markdown('## 📝 Prompt File Format\n\n');
        stream.markdown('Enhance your prompts with frontmatter for better integration:\n\n');
        stream.markdown('```yaml\n');
        stream.markdown('---\n');
        stream.markdown('name: "My Awesome Prompt"\n');
        stream.markdown('description: "Helps with code review"\n');
        stream.markdown('author: "Your Name"\n');
        stream.markdown('category: "development"\n');
        stream.markdown('tags: ["code-review", "best-practices"]\n');
        stream.markdown('version: "1.0"\n');
        stream.markdown('---\n\n');
        stream.markdown('Your prompt content here...\n');
        stream.markdown('```\n');
    }

    /**
     * Handle sync command from chat
     */
    private async handleSyncCommand(
        stream: vscode.ChatResponseStream, 
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.progress('🔄 Starting sync...');
        
        try {
            const result = await this.syncManager.syncNow();
            
            if (token.isCancellationRequested) {
                stream.markdown('❌ **Sync cancelled**\n\n');
                return;
            }
            
            if (result.success) {
                stream.markdown(`✅ **Sync completed successfully!**\n\n`);
                stream.markdown(`📥 Updated ${result.itemsUpdated} prompt(s) from your repositories.\n\n`);
                
                // Refresh cache after successful sync
                await this.refreshPromptCache();
                
                stream.markdown(`💾 Cache updated with ${this.promptCache.size} total prompts.\n\n`);
                
            } else {
                stream.markdown(`❌ **Sync failed:**\n\n`);
                stream.markdown(`${result.error}\n\n`);
            }
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            stream.markdown(`❌ **Sync failed:** ${errorMessage}\n\n`);
        }
    }

    /**
     * List all available prompts
     */
    private async listAvailablePrompts(stream: vscode.ChatResponseStream): Promise<void> {
        await this.refreshPromptCacheIfNeeded();
        
        const prompts = Array.from(this.promptCache.values());
        
        if (prompts.length === 0) {
            stream.markdown('📭 **No prompts found**\n\n');
            stream.markdown('Try syncing first or check your repository configuration.\n\n');
            return;
        }

        stream.markdown(`## 📚 Available Prompts (${prompts.length})\n\n`);
        
        // Group by category
        const categorized = prompts.reduce((acc, prompt) => {
            const category = prompt.category || 'other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(prompt);
            return acc;
        }, {} as Record<string, PromptMetadata[]>);

        // Display each category
        for (const [category, categoryPrompts] of Object.entries(categorized)) {
            const categoryIcon = this.getCategoryIcon(category);
            stream.markdown(`### ${categoryIcon} ${this.capitalizeCategoryName(category)}\n\n`);
            
            for (const prompt of categoryPrompts.sort((a, b) => a.name.localeCompare(b.name))) {
                stream.markdown(`- **#${prompt.name}** - ${prompt.description}`);
                
                if (prompt.tags && prompt.tags.length > 0) {
                    stream.markdown(` \`${prompt.tags.join('`, `')}\``);
                }
                
                stream.markdown('\n');
            }
            
            stream.markdown('\n');
        }
    }

    /**
     * Search prompts by term
     */
    private async searchPrompts(searchTerm: string, stream: vscode.ChatResponseStream): Promise<void> {
        if (!searchTerm.trim()) {
            stream.markdown('❓ **Please provide a search term**\n\n');
            stream.markdown('Example: `search code review`\n\n');
            return;
        }

        await this.refreshPromptCacheIfNeeded();
        
        const results = this.filterPrompts(searchTerm);
        
        if (results.length === 0) {
            stream.markdown(`🔍 **No prompts found matching "${searchTerm}"**\n\n`);
            return;
        }

        stream.markdown(`## 🔍 Search Results for "${searchTerm}" (${results.length})\n\n`);
        
        for (const prompt of results) {
            const categoryIcon = this.getCategoryIcon(prompt.category || 'other');
            
            stream.markdown(`### ${categoryIcon} #${prompt.name}\n\n`);
            stream.markdown(`${prompt.description}\n\n`);
            
            if (prompt.tags && prompt.tags.length > 0) {
                stream.markdown(`**Tags:** \`${prompt.tags.join('`, `')}\`\n\n`);
            }
        }
    }

    /**
     * Show prompts grouped by categories
     */
    private async showCategories(stream: vscode.ChatResponseStream): Promise<void> {
        await this.refreshPromptCacheIfNeeded();
        
        const prompts = Array.from(this.promptCache.values());
        
        if (prompts.length === 0) {
            stream.markdown('📭 **No prompts found**\n\n');
            return;
        }

        const categories = prompts.reduce((acc, prompt) => {
            const category = prompt.category || 'other';
            if (!acc[category]) {
                acc[category] = 0;
            }
            acc[category]++;
            return acc;
        }, {} as Record<string, number>);

        stream.markdown('## 📊 Prompt Categories\n\n');
        
        for (const [category, count] of Object.entries(categories).sort(([,a], [,b]) => b - a)) {
            const icon = this.getCategoryIcon(category);
            const name = this.capitalizeCategoryName(category);
            
            stream.markdown(`- ${icon} **${name}**: ${count} prompt${count === 1 ? '' : 's'}\n`);
        }
        
        stream.markdown('\n💡 Use `list` to see all prompts or `search <category>` to filter by category.\n\n');
    }

    /**
     * Show default response for unrecognized input
     */
    private async showDefaultResponse(stream: vscode.ChatResponseStream): Promise<void> {
        stream.markdown('👋 **Welcome to Promptitude!**\n\n');
        stream.markdown('I help you work with your synced prompts. Here are some things you can try:\n\n');
        stream.markdown('- Type `#` to see available prompts with autocomplete\n');
        stream.markdown('- Say `help` for detailed information\n');
        stream.markdown('- Say `list` to see all available prompts\n');
        stream.markdown('- Say `sync` to sync prompts from your repositories\n\n');
    }

    /**
     * Provide followup suggestions
     */
    private async provideFollowups(
        result: vscode.ChatResult,
        context: vscode.ChatContext,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatFollowup[]> {
        const followups: vscode.ChatFollowup[] = [
            {
                prompt: 'list',
                label: '📋 List all prompts'
            },
            {
                prompt: 'sync',
                label: '🔄 Sync prompts now'
            },
            {
                prompt: 'help',
                label: '❓ Show help'
            }
        ];

        // Add category-specific followups
        const categories = await this.getAvailableCategories();
        
        for (const category of categories.slice(0, 2)) { // Limit to 2 categories
            followups.push({
                prompt: `search ${category}`,
                label: `🔍 ${this.capitalizeCategoryName(category)} prompts`
            });
        }

        return followups;
    }

    /**
     * Get available prompt categories
     */
    private async getAvailableCategories(): Promise<string[]> {
        await this.refreshPromptCacheIfNeeded();
        
        const categories = new Set<string>();
        
        for (const prompt of this.promptCache.values()) {
            categories.add(prompt.category || 'other');
        }
        
        return Array.from(categories).sort();
    }

    /**
     * Get icon for category
     */
    private getCategoryIcon(category: string): string {
        switch (category) {
            case 'chatmode': return '💬';
            case 'instruction': return '📖';
            case 'prompt': return '💡';
            default: return '📄';
        }
    }

    /**
     * Capitalize category name
     */
    private capitalizeCategoryName(category: string): string {
        switch (category) {
            case 'chatmode': return 'Chat Modes';
            case 'instruction': return 'Instructions';
            case 'prompt': return 'Prompts';
            case 'other': return 'Other';
            default: return category.charAt(0).toUpperCase() + category.slice(1);
        }
    }

    /**
     * Get cache size for debugging
     */
    getCacheSize(): number {
        return this.promptCache.size;
    }

    /**
     * Get last cache update timestamp for debugging
     */
    getLastCacheUpdate(): number {
        return this.lastCacheUpdate;
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.logger.info('Disposing Chat Participant...');
        
        if (this.participant) {
            this.participant.dispose();
            this.participant = undefined;
        }
        
        this.promptCache.clear();
        
        this.logger.info('Chat Participant disposed');
    }
}
