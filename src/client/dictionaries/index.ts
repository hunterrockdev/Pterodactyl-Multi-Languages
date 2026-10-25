import { trDict } from './tr';
import { deDict } from './de';
import { ruDict } from './ru';
import { esDict } from './es';
import { frDict } from './fr';
import { itDict } from './it';
import { ptBRDict } from './ptBR';
import { nlDict } from './nl';
import { plDict } from './pl';
import { arDict } from './ar';

export const DICTIONARIES: Record<string, Record<string, string>> = {
    tr: trDict,
    de: deDict,
    ru: ruDict,
    es: esDict,
    fr: frDict,
    it: itDict,
    'pt-BR': ptBRDict,
    nl: nlDict,
    pl: plDict,
    ar: arDict,
};
