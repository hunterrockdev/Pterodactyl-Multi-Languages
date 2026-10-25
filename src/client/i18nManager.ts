import { http, queryClient } from '@pterodactyl/sdk';
import { LANGUAGES, getLanguage, type LanguageDefinition } from './locales';
import { getDictionary, getLowerDictionary } from './dictionary';

const STORAGE_KEY = 'ptero:language';

type LanguageChangeListener = (lang: LanguageDefinition) => void;
const listeners = new Set<LanguageChangeListener>();

let currentLanguageCode = 'en';
let observer: MutationObserver | null = null;
let rafScheduled = false;

export function getActiveLanguage(): LanguageDefinition {
    return getLanguage(currentLanguageCode);
}

export function subscribeToLanguageChange(listener: LanguageChangeListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function notifyListeners(lang: LanguageDefinition) {
    listeners.forEach((listener) => {
        try {
            listener(lang);
        } catch (e) {
            console.error('Error in language listener:', e);
        }
    });
}

/**
 * Initializes language preference and activates DOM translation engine.
 */
export function initLanguage(defaultFromConfig?: string): void {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const candidate = stored || defaultFromConfig || 'en';
    const lang = getLanguage(candidate);

    currentLanguageCode = lang.code;
    applyHtmlAttributes(lang);

    if (typeof window !== 'undefined') {
        // 1. Start observing DOM mutations immediately
        setupMutationObserver();

        // 2. Perform translation passes during initial page load & React hydration
        const intervals = [0, 50, 150, 300, 600, 1000, 1800, 3000];
        intervals.forEach((delay) => {
            setTimeout(() => {
                applyTranslationToDom(currentLanguageCode);
            }, delay);
        });
    }
}

function applyHtmlAttributes(lang: LanguageDefinition): void {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = lang.code;
        document.documentElement.dir = lang.dir || 'ltr';
        document.documentElement.setAttribute('data-ptero-lang', lang.code);
    }
}

interface DynamicTemplates {
    ofSlash: (x: string) => string;
    filesSelected: (n: string) => string;
    filesCount: (n: string) => string;
    andOthers: (n: string) => string;
    databasesAllocated: (n: string, total: string) => string;
    allocationsUsed: (n: string, total: string) => string;
    noMatching: (x: string) => string;
    noYet: (x: string) => string;
    deleteItem: (x: string) => string;
    restoreItem: (x: string) => string;
    unlockItem: (x: string) => string;
    modifyPerms: (x: string) => string;
    viewPerms: (x: string) => string;
    selectAllPerms: (x: string) => string;
    notesFor: (x: string) => string;
    filesUploading: (n: string) => string;
    cancelUpload: (x: string) => string;
    moreActionsFor: (x: string) => string;
    viewConnDetails: (x: string) => string;
}

const DYNAMIC_TEMPLATES: Record<string, DynamicTemplates> = {
    tr: {
        ofSlash: (x) => `/ ${x}`,
        filesSelected: (n) => `${n} dosya seçildi`,
        filesCount: (n) => `${n} dosya`,
        andOthers: (n) => `ve ${n} diğer`,
        databasesAllocated: (n, tot) => `Bu sunucuya ${tot} veritabanından ${n} tanesi ayrıldı.`,
        allocationsUsed: (n, tot) => `Bu sunucu için izin verilen ${tot} porttan ${n} tanesini kullanıyorsunuz.`,
        noMatching: (x) => `Eşleşen ${x} bulunamadı`,
        noYet: (x) => `Henüz ${x} yok`,
        deleteItem: (x) => `"${x}" Sil`,
        restoreItem: (x) => `"${x}" Geri Yükle`,
        unlockItem: (x) => `"${x}" Kilidini Aç`,
        modifyPerms: (x) => `${x} için izinleri düzenle`,
        viewPerms: (x) => `${x} izinlerini görüntüle`,
        selectAllPerms: (x) => `Tüm ${x} izinlerini seç`,
        notesFor: (x) => `${x} için notlar`,
        filesUploading: (n) => `${n} dosya yükleniyor, görmek için tıklayın`,
        cancelUpload: (x) => `${x} yüklemesini iptal et`,
        moreActionsFor: (x) => `${x} için diğer işlemler`,
        viewConnDetails: (x) => `${x} bağlantı ayrıntılarını görüntüle`,
    },
    de: {
        ofSlash: (x) => `/ ${x}`,
        filesSelected: (n) => `${n} Datei(en) ausgewählt`,
        filesCount: (n) => `${n} Dateien`,
        andOthers: (n) => `und ${n} weitere`,
        databasesAllocated: (n, tot) => `${n} von ${tot} Datenbanken wurden diesem Server zugewiesen.`,
        allocationsUsed: (n, tot) => `Sie nutzen derzeit ${n} von ${tot} erlaubten Zuweisungen.`,
        noMatching: (x) => `Keine passenden ${x} gefunden`,
        noYet: (x) => `Noch keine ${x}`,
        deleteItem: (x) => `"${x}" löschen`,
        restoreItem: (x) => `"${x}" wiederherstellen`,
        unlockItem: (x) => `"${x}" entsperren`,
        modifyPerms: (x) => `Berechtigungen für ${x} bearbeiten`,
        viewPerms: (x) => `Berechtigungen für ${x} anzeigen`,
        selectAllPerms: (x) => `Alle ${x}-Berechtigungen auswählen`,
        notesFor: (x) => `Notizen für ${x}`,
        filesUploading: (n) => `${n} Datei(en) werden hochgeladen, zum Anzeigen klicken`,
        cancelUpload: (x) => `Upload von ${x} abbrechen`,
        moreActionsFor: (x) => `Weitere Aktionen für ${x}`,
        viewConnDetails: (x) => `Verbindungsdetails für ${x} anzeigen`,
    },
    ru: {
        ofSlash: (x) => `/ ${x}`,
        filesSelected: (n) => `Выбрано файлов: ${n}`,
        filesCount: (n) => `${n} файлов`,
        andOthers: (n) => `и ещё ${n}`,
        databasesAllocated: (n, tot) => `Выделено баз данных: ${n} из ${tot}.`,
        allocationsUsed: (n, tot) => `Используется портов: ${n} из ${tot} разрешённых.`,
        noMatching: (x) => `Совпадений не найдено (${x})`,
        noYet: (x) => `Пока нет ${x}`,
        deleteItem: (x) => `Удалить "${x}"`,
        restoreItem: (x) => `Восстановить "${x}"`,
        unlockItem: (x) => `Разблокировать "${x}"`,
        modifyPerms: (x) => `Изменить права для ${x}`,
        viewPerms: (x) => `Просмотр прав для ${x}`,
        selectAllPerms: (x) => `Выбрать все права ${x}`,
        notesFor: (x) => `Заметки для ${x}`,
        filesUploading: (n) => `Загружается файлов: ${n}, нажмите для просмотра`,
        cancelUpload: (x) => `Отменить загрузку ${x}`,
        moreActionsFor: (x) => `Действия для ${x}`,
        viewConnDetails: (x) => `Данные подключения к ${x}`,
    },
    es: {
        ofSlash: (x) => `/ ${x}`,
        filesSelected: (n) => `${n} archivo(s) seleccionado(s)`,
        filesCount: (n) => `${n} archivos`,
        andOthers: (n) => `y ${n} más`,
        databasesAllocated: (n, tot) => `Se han asignado ${n} de ${tot} bases de datos a este servidor.`,
        allocationsUsed: (n, tot) => `Actualmente estás utilizando ${n} de ${tot} asignaciones permitidas.`,
        noMatching: (x) => `No se encontraron ${x}`,
        noYet: (x) => `No hay ${x} todavía`,
        deleteItem: (x) => `Eliminar "${x}"`,
        restoreItem: (x) => `Restaurar "${x}"`,
        unlockItem: (x) => `Desbloquear "${x}"`,
        modifyPerms: (x) => `Modificar permisos de ${x}`,
        viewPerms: (x) => `Ver permisos de ${x}`,
        selectAllPerms: (x) => `Seleccionar todos los permisos de ${x}`,
        notesFor: (x) => `Notas para ${x}`,
        filesUploading: (n) => `${n} archivo(s) subiendo, clic para ver`,
        cancelUpload: (x) => `Cancelar subida de ${x}`,
        moreActionsFor: (x) => `Más acciones para ${x}`,
        viewConnDetails: (x) => `Ver detalles de conexión de ${x}`,
    },
    fr: {
        ofSlash: (x) => `/ ${x}`,
        filesSelected: (n) => `${n} fichier(s) sélectionné(s)`,
        filesCount: (n) => `${n} fichiers`,
        andOthers: (n) => `et ${n} autres`,
        databasesAllocated: (n, tot) => `${n} sur ${tot} bases de données ont été allouées à ce serveur.`,
        allocationsUsed: (n, tot) => `Vous utilisez actuellement ${n} sur ${tot} allocations autorisées.`,
        noMatching: (x) => `Aucun ${x} correspondant`,
        noYet: (x) => `Pas encore de ${x}`,
        deleteItem: (x) => `Supprimer "${x}"`,
        restoreItem: (x) => `Restaurer "${x}"`,
        unlockItem: (x) => `Déverrouiller "${x}"`,
        modifyPerms: (x) => `Modifier les permissions pour ${x}`,
        viewPerms: (x) => `Voir les permissions pour ${x}`,
        selectAllPerms: (x) => `Sélectionner toutes les permissions ${x}`,
        notesFor: (x) => `Notes pour ${x}`,
        filesUploading: (n) => `${n} fichier(s) en cours d'envoi, cliquez pour afficher`,
        cancelUpload: (x) => `Annuler l'envoi de ${x}`,
        moreActionsFor: (x) => `Plus d'actions pour ${x}`,
        viewConnDetails: (x) => `Voir les détails de connexion de ${x}`,
    },
    it: {
        ofSlash: (x) => `/ ${x}`,
        filesSelected: (n) => `${n} file selezionati`,
        filesCount: (n) => `${n} file`,
        andOthers: (n) => `e altri ${n}`,
        databasesAllocated: (n, tot) => `${n} su ${tot} database sono stati allocati a questo server.`,
        allocationsUsed: (n, tot) => `Attualmente stai utilizzando ${n} su ${tot} allocazioni consentite.`,
        noMatching: (x) => `Nessun ${x} corrispondente`,
        noYet: (x) => `Nessun ${x} presente`,
        deleteItem: (x) => `Elimina "${x}"`,
        restoreItem: (x) => `Ripristina "${x}"`,
        unlockItem: (x) => `Sblocca "${x}"`,
        modifyPerms: (x) => `Modifica permessi per ${x}`,
        viewPerms: (x) => `Visualizza permessi per ${x}`,
        selectAllPerms: (x) => `Seleziona tutti i permessi per ${x}`,
        notesFor: (x) => `Note per ${x}`,
        filesUploading: (n) => `${n} file in caricamento, fai clic per visualizzare`,
        cancelUpload: (x) => `Annulla caricamento di ${x}`,
        moreActionsFor: (x) => `Altre azioni per ${x}`,
        viewConnDetails: (x) => `Visualizza dettagli connessione per ${x}`,
    },
    'pt-BR': {
        ofSlash: (x) => `/ ${x}`,
        filesSelected: (n) => `${n} arquivo(s) selecionado(s)`,
        filesCount: (n) => `${n} arquivos`,
        andOthers: (n) => `e mais ${n}`,
        databasesAllocated: (n, tot) => `${n} de ${tot} bancos de dados foram alocados para este servidor.`,
        allocationsUsed: (n, tot) => `Você está usando ${n} de ${tot} alocações permitidas.`,
        noMatching: (x) => `Nenhum ${x} correspondente`,
        noYet: (x) => `Nenhum ${x} ainda`,
        deleteItem: (x) => `Excluir "${x}"`,
        restoreItem: (x) => `Restaurar "${x}"`,
        unlockItem: (x) => `Desbloquear "${x}"`,
        modifyPerms: (x) => `Modificar permissões de ${x}`,
        viewPerms: (x) => `Visualizar permissões de ${x}`,
        selectAllPerms: (x) => `Selecionar todas as permissões de ${x}`,
        notesFor: (x) => `Notas para ${x}`,
        filesUploading: (n) => `${n} arquivo(s) sendo enviados, clique para ver`,
        cancelUpload: (x) => `Cancelar envio de ${x}`,
        moreActionsFor: (x) => `Mais ações para ${x}`,
        viewConnDetails: (x) => `Ver detalhes de conexão de ${x}`,
    },
    nl: {
        ofSlash: (x) => `/ ${x}`,
        filesSelected: (n) => `${n} bestand(en) geselecteerd`,
        filesCount: (n) => `${n} bestanden`,
        andOthers: (n) => `en nog ${n}`,
        databasesAllocated: (n, tot) => `${n} van de ${tot} databases zijn toegewezen aan deze server.`,
        allocationsUsed: (n, tot) => `U gebruikt momenteel ${n} van de ${tot} toegestane poorttoewijzingen.`,
        noMatching: (x) => `Geen overeenkomende ${x}`,
        noYet: (x) => `Nog geen ${x}`,
        deleteItem: (x) => `"${x}" verwijderen`,
        restoreItem: (x) => `"${x}" herstellen`,
        unlockItem: (x) => `"${x}" ontgrendelen`,
        modifyPerms: (x) => `Rechten bewerken voor ${x}`,
        viewPerms: (x) => `Rechten bekijken voor ${x}`,
        selectAllPerms: (x) => `Alle ${x}-rechten selecteren`,
        notesFor: (x) => `Notities voor ${x}`,
        filesUploading: (n) => `${n} bestand(en) worden geüpload, klik om te bekijken`,
        cancelUpload: (x) => `Upload van ${x} annuleren`,
        moreActionsFor: (x) => `Meer acties voor ${x}`,
        viewConnDetails: (x) => `Verbindingsdetails voor ${x} bekijken`,
    },
    pl: {
        ofSlash: (x) => `/ ${x}`,
        filesSelected: (n) => `Wybrano ${n} plików`,
        filesCount: (n) => `${n} plików`,
        andOthers: (n) => `i ${n} innych`,
        databasesAllocated: (n, tot) => `Przydzielono ${n} z ${tot} baz danych do tego serwera.`,
        allocationsUsed: (n, tot) => `Obecnie wykorzystujesz ${n} z ${tot} dozwolonych alokacji.`,
        noMatching: (x) => `Brak pasujących ${x}`,
        noYet: (x) => `Brak ${x}`,
        deleteItem: (x) => `Usuń "${x}"`,
        restoreItem: (x) => `Przywróć "${x}"`,
        unlockItem: (x) => `Odblokuj "${x}"`,
        modifyPerms: (x) => `Modyfikuj uprawnienia dla ${x}`,
        viewPerms: (x) => `Pokaż uprawnienia dla ${x}`,
        selectAllPerms: (x) => `Zaznacz wszystkie uprawnienia ${x}`,
        notesFor: (x) => `Notatki dla ${x}`,
        filesUploading: (n) => `Przesyłanie ${n} plików, kliknij aby zobaczyć`,
        cancelUpload: (x) => `Anuluj przesyłanie ${x}`,
        moreActionsFor: (x) => `Więcej opcji dla ${x}`,
        viewConnDetails: (x) => `Szczegóły połączenia dla ${x}`,
    },
    ar: {
        ofSlash: (x) => `/ ${x}`,
        filesSelected: (n) => `تم تحديد ${n} ملف`,
        filesCount: (n) => `${n} ملفات`,
        andOthers: (n) => `و ${n} آخرين`,
        databasesAllocated: (n, tot) => `تم تخصيص ${n} من أصل ${tot} قواعد بيانات لهذا الخادم.`,
        allocationsUsed: (n, tot) => `أنت تستخدم حالياً ${n} من أصل ${tot} من المنافذ المسموحة.`,
        noMatching: (x) => `لا توجد ${x} مطابقة`,
        noYet: (x) => `لا توجد ${x} بعد`,
        deleteItem: (x) => `حذف "${x}"`,
        restoreItem: (x) => `استعادة "${x}"`,
        unlockItem: (x) => `فك قفل "${x}"`,
        modifyPerms: (x) => `تعديل الصلاحيات لـ ${x}`,
        viewPerms: (x) => `عرض الصلاحيات لـ ${x}`,
        selectAllPerms: (x) => `تحديد جميع صلاحيات ${x}`,
        notesFor: (x) => `ملاحظات لـ ${x}`,
        filesUploading: (n) => `جاري رفع ${n} ملفات، انقر للعرض`,
        cancelUpload: (x) => `إلغاء رفع ${x}`,
        moreActionsFor: (x) => `إجراءات إضافية لـ ${x}`,
        viewConnDetails: (x) => `عرض بيانات الاتصال لـ ${x}`,
    },
};

function matchDynamicPattern(text: string, langCode: string): string | null {
    const t = DYNAMIC_TEMPLATES[langCode];
    if (!t) return null;

    let m = text.match(/^of\s+(.+)$/i);
    if (m) return t.ofSlash(m[1]);

    m = text.match(/^(\d+)\s+files?\s+selected$/i);
    if (m) return t.filesSelected(m[1]);

    m = text.match(/^(\d+)\s+files?$/i);
    if (m) return t.filesCount(m[1]);

    m = text.match(/^and\s+(\d+)\s+others?$/i);
    if (m) return t.andOthers(m[1]);

    m = text.match(/^(\d+)\s+of\s+(\d+)\s+databases have been allocated to this server\.?$/i);
    if (m) return t.databasesAllocated(m[1], m[2]);

    m = text.match(/^You are currently using (\d+) of (\d+) allowed allocations for this server\.?$/i);
    if (m) return t.allocationsUsed(m[1], m[2]);

    m = text.match(/^No matching (.+)$/i);
    if (m) return t.noMatching(m[1]);

    m = text.match(/^No (.+) yet$/i);
    if (m) return t.noYet(m[1]);

    m = text.match(/^Delete ["“'](.+)["”']$/i);
    if (m) return t.deleteItem(m[1]);

    m = text.match(/^Restore ["“'](.+)["”']$/i);
    if (m) return t.restoreItem(m[1]);

    m = text.match(/^Unlock ["“'](.+)["”']$/i);
    if (m) return t.unlockItem(m[1]);

    m = text.match(/^Modify permissions for (.+)$/i);
    if (m) return t.modifyPerms(m[1]);

    m = text.match(/^View permissions for (.+)$/i);
    if (m) return t.viewPerms(m[1]);

    m = text.match(/^Select all (.+) permissions$/i);
    if (m) return t.selectAllPerms(m[1]);

    m = text.match(/^Notes for (.+)$/i);
    if (m) return t.notesFor(m[1]);

    m = text.match(/^(\d+)\s+files are uploading, click to view$/i);
    if (m) return t.filesUploading(m[1]);

    m = text.match(/^Cancel upload of (.+)$/i);
    if (m) return t.cancelUpload(m[1]);

    m = text.match(/^More actions for (.+)$/i);
    if (m) return t.moreActionsFor(m[1]);

    m = text.match(/^View (.+) connection details$/i);
    if (m) return t.viewConnDetails(m[1]);

    return null;
}

function translatePhrase(
    rawText: string,
    langCode: string,
    dict: Record<string, string>,
    lowerDict: Record<string, string>
): string | null {
    if (!rawText) return null;
    const trimmed = rawText.trim();
    if (!trimmed) return null;

    if (dict[trimmed]) return dict[trimmed];
    const lower = trimmed.toLowerCase();
    if (lowerDict[lower]) return lowerDict[lower];

    const pattern = matchDynamicPattern(trimmed, langCode);
    if (pattern) return pattern;

    return null;
}

/**
 * Traverses DOM text nodes safely without destroying React DOM tree.
 */
export function applyTranslationToDom(langCode: string, root: Node = document.body): void {
    if (typeof document === 'undefined' || !root) return;

    const isEnglish = langCode === 'en';
    const dict = getDictionary(langCode);
    const lowerDict = getLowerDictionary(langCode);

    // 1. Walk Text Nodes
    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const tag = parent.tagName.toLowerCase();
                if (tag === 'script' || tag === 'style' || tag === 'code' || tag === 'pre') {
                    return NodeFilter.FILTER_REJECT;
                }
                // Don't translate our own language selector menu
                if (parent.closest('.ml-language-dropdown')) {
                    return NodeFilter.FILTER_REJECT;
                }
                const val = node.nodeValue;
                if (!val || val.trim().length === 0) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            },
        }
    );

    let node: Text | null = walker.nextNode() as Text | null;
    while (node) {
        const textNode = node;
        node = walker.nextNode() as Text | null;

        const anyNode = textNode as any;
        const currentText = textNode.data;
        const trimmed = currentText.trim();

        if (isEnglish) {
            // Restore original English if node was previously translated
            if (anyNode.__ptero_orig && textNode.data !== anyNode.__ptero_orig) {
                textNode.data = anyNode.__ptero_orig;
            }
        } else {
            const translated = translatePhrase(trimmed, langCode, dict, lowerDict);
            if (translated) {
                anyNode.__ptero_orig = currentText;
                const newText = currentText.replace(trimmed, translated);
                if (textNode.data !== newText) {
                    textNode.data = newText;
                }
            } else if (anyNode.__ptero_orig) {
                const origTrimmed = anyNode.__ptero_orig.trim();
                const transOrig = translatePhrase(origTrimmed, langCode, dict, lowerDict);
                if (transOrig) {
                    const newText = anyNode.__ptero_orig.replace(origTrimmed, transOrig);
                    if (textNode.data !== newText) {
                        textNode.data = newText;
                    }
                }
            }
        }
    }

    // 2. Translate Input and Textarea Placeholders
    const queryRoot = (root as Element).querySelectorAll ? (root as Element) : document.body;
    const inputs = queryRoot.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]');

    inputs.forEach((input) => {
        const currentPh = input.placeholder;
        const trimmed = currentPh.trim();

        if (isEnglish) {
            const orig = input.getAttribute('data-ptero-orig-ph');
            if (orig && input.placeholder !== orig) {
                input.placeholder = orig;
            }
        } else {
            const translated = translatePhrase(trimmed, langCode, dict, lowerDict);
            if (translated) {
                input.setAttribute('data-ptero-orig-ph', currentPh);
                input.placeholder = translated;
            } else if (input.hasAttribute('data-ptero-orig-ph')) {
                const origPh = input.getAttribute('data-ptero-orig-ph') || '';
                const origTrimmed = origPh.trim();
                const transOrig = translatePhrase(origTrimmed, langCode, dict, lowerDict);
                if (transOrig && input.placeholder !== transOrig) {
                    input.placeholder = transOrig;
                }
            }
        }
    });

    // 3. Translate Element Attributes (aria-label, title)
    const labeledElements = queryRoot.querySelectorAll<HTMLElement>('[aria-label], [title]');
    labeledElements.forEach((el) => {
        if (el.closest('.ml-language-dropdown')) return;

        if (el.hasAttribute('aria-label')) {
            const currentAria = el.getAttribute('aria-label') || '';
            if (isEnglish) {
                const orig = el.getAttribute('data-ptero-orig-aria');
                if (orig) el.setAttribute('aria-label', orig);
            } else {
                const trans = translatePhrase(currentAria, langCode, dict, lowerDict);
                if (trans) {
                    if (!el.hasAttribute('data-ptero-orig-aria')) {
                        el.setAttribute('data-ptero-orig-aria', currentAria);
                    }
                    el.setAttribute('aria-label', trans);
                }
            }
        }

        if (el.hasAttribute('title')) {
            const currentTitle = el.getAttribute('title') || '';
            if (isEnglish) {
                const orig = el.getAttribute('data-ptero-orig-title');
                if (orig) el.setAttribute('title', orig);
            } else {
                const trans = translatePhrase(currentTitle, langCode, dict, lowerDict);
                if (trans) {
                    if (!el.hasAttribute('data-ptero-orig-title')) {
                        el.setAttribute('data-ptero-orig-title', currentTitle);
                    }
                    el.setAttribute('title', trans);
                }
            }
        }
    });
}

function setupMutationObserver() {
    if (observer || typeof window === 'undefined') return;

    observer = new MutationObserver(() => {
        if (currentLanguageCode === 'en') return;

        if (!rafScheduled) {
            rafScheduled = true;
            requestAnimationFrame(() => {
                rafScheduled = false;
                applyTranslationToDom(currentLanguageCode, document.body);
            });
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
    });
}

/**
 * Switches the active language across the entire application.
 */
export async function changeLanguage(code: string, persistRemote = true): Promise<void> {
    const lang = getLanguage(code);
    if (!lang) return;

    currentLanguageCode = lang.code;
    localStorage.setItem(STORAGE_KEY, lang.code);
    applyHtmlAttributes(lang);

    // 1. Immediately apply translations to the DOM
    applyTranslationToDom(lang.code, document.body);

    // 2. Notify our extension UI components
    notifyListeners(lang);

    // 3. Update Pterodactyl's core React Query account user cache
    try {
        queryClient.setQueryData(['account', 'current-user'], (prev: any) => {
            if (!prev) return prev;
            return { ...prev, language: lang.code };
        });
    } catch {
        // QueryClient not yet ready or user not logged in
    }

    // 4. Persist to server database if authenticated
    if (persistRemote) {
        try {
            await http.post('/api/client/extensions/multi-language/preference', { language: lang.code });
        } catch {
            // Guest or offline - localStorage handles persistence
        }
    }
}

/**
 * Helper to fetch localized text from current language
 */
export function t(ns: 'strings' | 'dashboard' | 'server' | 'account' | 'auth', key: string, fallback?: string): string {
    const active = getActiveLanguage();
    const group = active.translations[ns];
    if (group && group[key]) {
        return group[key];
    }
    const enGroup = LANGUAGES.en.translations[ns];
    if (enGroup && enGroup[key]) {
        return enGroup[key];
    }
    return fallback ?? key;
}
