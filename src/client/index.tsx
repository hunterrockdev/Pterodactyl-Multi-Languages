import './styles.css';
import { definePterodactylExtension } from '@pterodactyl/sdk';
import { initLanguage } from './i18nManager';
import HeaderLanguageDropdown from './components/HeaderLanguageDropdown';
import AccountLanguageCard from './components/AccountLanguageCard';

export default definePterodactylExtension({
    setup({ config, slots }) {
        const siteLocale = typeof (window as any)?.SiteConfiguration?.locale === 'string'
            ? (window as any).SiteConfiguration.locale
            : undefined;
        const configLang = typeof config?.default_language === 'string' ? config.default_language : undefined;
        const defaultLang = (siteLocale && siteLocale !== 'en') ? siteLocale : (configLang || siteLocale || 'en');
        const showHeader = config?.show_header_dropdown !== false;
        const allowUserOverride = config?.allow_user_override !== false;

        // 1. Initialize active language and sync HTML attributes & /admin/settings
        initLanguage(defaultLang);

        // 2. Register Header Language Switcher Dropdown (top navigation bar)
        if (showHeader) {
            slots.register('nav.items.after', HeaderLanguageDropdown);
        }

        // 3. Register Account Language Preference Card (/account page)
        if (allowUserOverride) {
            slots.register('account.overview.after', AccountLanguageCard);
        }
    },
});
