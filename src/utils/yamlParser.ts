/**
 * Simple YAML parser for frontmatter
 * Handles basic key-value pairs and arrays
 */
export class SimpleYamlParser {
    
    /**
     * Parse YAML frontmatter content
     */
    static parse(yamlContent: string): Record<string, any> {
        const result: Record<string, any> = {};
        
        const lines = yamlContent.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
        
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;
            
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            
            result[key] = this.parseValue(value);
        }
        
        return result;
    }
    
    /**
     * Parse individual YAML value
     */
    private static parseValue(value: string): any {
        // Remove surrounding quotes
        const cleaned = value.replace(/^["']|["']$/g, '');
        
        // Handle arrays: [item1, item2, item3]
        if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
            const arrayContent = cleaned.slice(1, -1);
            return arrayContent
                .split(',')
                .map(item => item.trim().replace(/^["']|["']$/g, ''))
                .filter(item => item);
        }
        
        // Handle booleans
        if (cleaned.toLowerCase() === 'true') return true;
        if (cleaned.toLowerCase() === 'false') return false;
        
        // Handle numbers
        if (/^\d+$/.test(cleaned)) return parseInt(cleaned, 10);
        if (/^\d*\.\d+$/.test(cleaned)) return parseFloat(cleaned);
        
        // Return as string
        return cleaned;
    }
}
