/**
 * Metadata structure for synced prompts
 */
export interface PromptMetadata {
    /** Unique identifier for the prompt */
    name: string;
    
    /** Human-readable description */
    description: string;
    
    /** Author information */
    author?: string;
    
    /** Categorization tags */
    tags?: string[];
    
    /** Category classification (chatmode, instruction, prompt) */
    category?: 'chatmode' | 'instruction' | 'prompt' | 'other';
    
    /** Version information */
    version?: string;
    
    /** The actual prompt content */
    content: string;
    
    /** Local file path */
    filePath: string;
    
    /** Repository source information */
    source?: {
        repository: string;
        branch: string;
        path: string;
    };
    
    /** When the prompt was last synced */
    lastSynced?: Date;
}

/**
 * Chat completion configuration
 */
export interface ChatCompletionConfig {
    /** Trigger characters for autocomplete */
    triggerCharacters: string[];
    
    /** Maximum number of suggestions */
    maxSuggestions: number;
    
    /** Enable rich hover documentation */
    enableRichHover: boolean;
    
    /** Show content preview in hover */
    showContentPreview: boolean;
    
    /** Preview content length limit */
    previewLength: number;
}

/**
 * Prompt file parsing result
 */
export interface ParsedPromptFile {
    /** Extracted metadata */
    metadata: Partial<PromptMetadata>;
    
    /** Main content after frontmatter */
    content: string;
    
    /** Whether frontmatter was found */
    hasFrontmatter: boolean;
    
    /** Parsing errors if any */
    errors?: string[];
}
