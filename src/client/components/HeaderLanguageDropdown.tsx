import React, { useState, useEffect } from 'react';
import { DropdownMenu } from '@pterodactyl/sdk';
import { LANGUAGE_LIST } from '../locales';
import { getActiveLanguage, changeLanguage, subscribeToLanguageChange } from '../i18nManager';

const navTriggerClass = [
    'flex h-full shrink-0 items-center px-2 sm:px-3 text-muted-foreground cursor-pointer',
    'transition-[background-color,border-color,color,box-shadow] duration-150 hover:bg-popover hover:border-border',
    'hover:text-foreground active:text-foreground',
    'hover:shadow-navigation-active active:shadow-navigation-active',
].join(' ');

export default function HeaderLanguageDropdown() {
    const [activeLang, setActiveLang] = useState(getActiveLanguage());

    useEffect(() => {
        return subscribeToLanguageChange((lang) => {
            setActiveLang(lang);
        });
    }, []);

    const handleSelect = (code: string) => {
        void changeLanguage(code);
    };

    return (
        <DropdownMenu
            triggerClassName={navTriggerClass}
            className="w-56"
            triggerContent={
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/80 bg-background/80 shadow-xs hover:border-primary/50 transition-all duration-150">
                    <span className="text-base leading-none select-none">{activeLang.flag}</span>
                    <span className="text-xs font-bold tracking-wider uppercase text-foreground">
                        {activeLang.code}
                    </span>
                </div>
            }
        >
            {LANGUAGE_LIST.map((lang) => (
                <DropdownMenu.Item
                    key={lang.code}
                    checked={lang.code === activeLang.code}
                    onClick={() => handleSelect(lang.code)}
                >
                    <div className="flex items-center gap-2.5">
                        <span className="text-base select-none">{lang.flag}</span>
                        <span className="font-medium">{lang.nativeName}</span>
                        <span className="text-xs text-muted-foreground">({lang.name})</span>
                    </div>
                </DropdownMenu.Item>
            ))}
        </DropdownMenu>
    );
}
