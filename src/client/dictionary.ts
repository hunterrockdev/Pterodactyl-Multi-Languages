/**
 * Comprehensive UI Translation Dictionaries for Pterodactyl v2
 * Modular structure covering all 11 supported languages.
 */
import { DICTIONARIES } from './dictionaries';

export { DICTIONARIES };

// Case-insensitive lookup map cache
const lowerCache: Record<string, Record<string, string>> = {};

export function getDictionary(langCode: string): Record<string, string> {
    return DICTIONARIES[langCode] || {};
}

export function getLowerDictionary(langCode: string): Record<string, string> {
    if (!lowerCache[langCode]) {
        const dict = getDictionary(langCode);
        const map: Record<string, string> = {};
        for (const [k, v] of Object.entries(dict)) {
            map[k.toLowerCase()] = v;
        }
        lowerCache[langCode] = map;
    }
    return lowerCache[langCode];
}
