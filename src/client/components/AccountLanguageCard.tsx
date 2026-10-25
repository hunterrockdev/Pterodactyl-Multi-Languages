import React, { useState, useEffect } from 'react';
import { Globe, Check, Sparkles } from 'lucide-react';
import { LANGUAGE_LIST } from '../locales';
import { getActiveLanguage, changeLanguage, subscribeToLanguageChange, t } from '../i18nManager';

export default function AccountLanguageCard() {
    const [activeLang, setActiveLang] = useState(getActiveLanguage());
    const [savedNotice, setSavedNotice] = useState(false);

    useEffect(() => {
        return subscribeToLanguageChange((lang) => {
            setActiveLang(lang);
        });
    }, []);

    const handleSelect = async (code: string) => {
        if (code === activeLang.code) return;
        await changeLanguage(code, true);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
    };

    return (
        <div className="ml-account-card mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Globe className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-foreground">
                            {t('account', 'language_card', 'Language & Localization')}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {t('account', 'language_card_desc', 'Select your preferred interface language across the panel.')}
                        </p>
                    </div>
                </div>

                {savedNotice && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium animate-in fade-in duration-200">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t('account', 'saved_success', 'Saved')}</span>
                    </div>
                )}
            </div>

            {/* Language Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-5">
                {LANGUAGE_LIST.map((lang) => {
                    const isSelected = lang.code === activeLang.code;
                    return (
                        <button
                            key={lang.code}
                            type="button"
                            onClick={() => handleSelect(lang.code)}
                            className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                                isSelected
                                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                    : 'border-border bg-background/50 hover:bg-muted/40 hover:border-muted-foreground/30'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-xl select-none shrink-0">{lang.flag}</span>
                                <div className="truncate">
                                    <div className={`text-xs truncate ${isSelected ? 'font-semibold text-primary' : 'font-medium text-foreground'}`}>
                                        {lang.nativeName}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground truncate">
                                        {lang.name}
                                    </div>
                                </div>
                            </div>
                            {isSelected && (
                                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0 ml-1.5">
                                    <Check className="w-2.5 h-2.5" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
