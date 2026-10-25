export interface LanguageDefinition {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    dir?: 'ltr' | 'rtl';
    translations: {
        strings: Record<string, string>;
        dashboard: Record<string, string>;
        server: Record<string, string>;
        account: Record<string, string>;
        auth: Record<string, string>;
    };
}
