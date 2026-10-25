import type { LanguageDefinition } from './types';
import { en } from './en';
import { tr } from './tr';
import { de } from './de';
import { ru } from './ru';
import { ar } from './ar';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { ptBR } from './ptBR';
import { nl } from './nl';
import { pl } from './pl';

export * from './types';

export const LANGUAGES: Record<string, LanguageDefinition> = {
    en,
    tr,
    de,
    ru,
    ar,
    es,
    fr,
    it,
    'pt-BR': ptBR,
    nl,
    pl,
};

export const LANGUAGE_LIST = Object.values(LANGUAGES);

export function getLanguage(code: string): LanguageDefinition {
    return LANGUAGES[code] || LANGUAGES.en;
}
