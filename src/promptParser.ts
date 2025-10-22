import { PromptMetadata, ParsedPromptFile } from './promptMetadata';
import { SimpleYamlParser } from './utils/yamlParser';
import { FileSystemManager } from './utils/fileSystem';
import { Logger } from './utils/logger';

/**
 * Handles parsing of prompt files with frontmatter support
 */
export class PromptParser {
    private logger: Logger;
    private fileSystem: FileSystemManager;
    
    constructor() {
        this.logger = Logger.get('PromptParser');
        this.fileSystem = new FileSystemManager();
    }
    
    /**
     * Parse a prompt file from file path
     */
    async parseFromFile(filePath: string): Promise<PromptMetadata | null> {
        try {
            const content = await this.fileSystem.readFileContent(filePath);
            const parsed = this.parseContent(content, filePath);
            
            return this.createPromptMetadata(parsed, filePath);
        } catch (error) {
            this.logger.warn(`Failed to parse prompt file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    
    /**
     * Parse prompt content with frontmatter
     */
    parseContent(content: string, filePath: string): ParsedPromptFile {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (match) {
            try {
                const yamlContent = match[1];
                const promptContent = match[2].trim();
                const metadata = SimpleYamlParser.parse(yamlContent);
                
                return {
                    metadata,
                    content: promptContent,
                    hasFrontmatter: true
                };
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                this.logger.warn(`Failed to parse frontmatter in ${filePath}: ${errorMsg}`);
                return {
                    metadata: {},
                    content: content,
                    hasFrontmatter: false,
                    errors: [`Frontmatter parsing failed: ${errorMsg}`]
                };
            }
        }
        
        return {
            metadata: {},
            content: content.trim(),
            hasFrontmatter: false
        };
    }
    
    /**
     * Create PromptMetadata from parsed file
     */
    private createPromptMetadata(parsed: ParsedPromptFile, filePath: string): PromptMetadata {
        const fileName = this.fileSystem.getBasename(filePath, '.md');
        const name = parsed.metadata.name as string || fileName;
        
        // Generate description if not provided
        const description = parsed.metadata.description as string || 
            this.generateDescriptionFromContent(parsed.content);
        
        // Extract source information from HTML comment if present
        const sourceMatch = parsed.content.match(/<!-- Source: (.+?)\/(.+?)\/(.+?) \(branch: (.+?)\) -->/);
        const source = sourceMatch ? {
            repository: `${sourceMatch[1]}/${sourceMatch[2]}`,
            branch: sourceMatch[4],
            path: sourceMatch[3]
        } : undefined;
        
        // Remove source comment from content if present
        const cleanContent = parsed.content.replace(/<!-- Source: .+? -->\n?/, '').trim();
        
        return {
            name,
            description,
            author: parsed.metadata.author as string,
            tags: this.normalizeTags(parsed.metadata.tags),
            category: this.normalizeCategory(parsed.metadata.category as string),
            version: parsed.metadata.version as string,
            content: cleanContent,
            filePath,
            source,
            lastSynced: new Date()
        };
    }
    
    /**
     * Generate description from content if not provided
     */
    private generateDescriptionFromContent(content: string): string {
        // Remove HTML comments
        const cleanContent = content.replace(/<!--[\s\S]*?-->/g, '');
        const lines = cleanContent.split('\n').filter(line => line.trim());
        
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            // Remove markdown headers
            const cleaned = firstLine.replace(/^#+\s*/, '');
            return cleaned.length > 100 ? cleaned.substring(0, 100) + '...' : cleaned;
        }
        
        return 'No description available';
    }
    
    /**
     * Normalize tags to string array
     */
    private normalizeTags(tags: any): string[] | undefined {
        if (!tags) return undefined;
        
        if (Array.isArray(tags)) {
            return tags.map(t => String(t).trim()).filter(t => t);
        }
        
        if (typeof tags === 'string') {
            return tags.split(',').map(t => t.trim()).filter(t => t);
        }
        
        return undefined;
    }
    
    /**
     * Normalize category
     */
    private normalizeCategory(category: string): 'chatmode' | 'instruction' | 'prompt' | 'other' {
        if (!category) return 'other';
        
        const normalized = category.toLowerCase().trim();
        
        switch (normalized) {
            case 'chatmode':
            case 'chat-mode':
            case 'chat':
                return 'chatmode';
            case 'instruction':
            case 'instructions':
                return 'instruction';
            case 'prompt':
            case 'prompts':
                return 'prompt';
            default:
                return 'other';
        }
    }
}
