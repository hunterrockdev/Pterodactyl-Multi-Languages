<?php

declare(strict_types=1);

namespace Hunterrock\MultiLanguage;

use Pterodactyl\Extensions\ExtensionProvider;
use Pterodactyl\Services\Extensions\ExtensionSettingDefinition;
use Pterodactyl\Services\Extensions\ExtensionSettingsDefinition;

class MultiLanguageServiceProvider extends ExtensionProvider
{
    /**
     * Register extension settings and API routes.
     * Settings defined here are rendered in Admin -> Extensions -> Settings icon.
     * Marked ->frontend(), the config is passed to the frontend bundle via ctx.config.
     */
    public function register(): void
    {
        $this->registerSettings(new ExtensionSettingsDefinition($this->settings(), [
            ExtensionSettingDefinition::make('default_language', 'default_language', 'en')
                ->label('Default Language / Varsayılan Dil')
                ->help('Global fallback language for all panels, login screens, and new users.')
                ->field('select', [
                    ['value' => 'en', 'label' => '🇬🇧 English'],
                    ['value' => 'tr', 'label' => '🇹🇷 Türkçe'],
                    ['value' => 'de', 'label' => '🇩🇪 Deutsch'],
                    ['value' => 'ru', 'label' => '🇷🇺 Русский'],
                    ['value' => 'ar', 'label' => '🇸🇦 العربية'],
                    ['value' => 'es', 'label' => '🇪🇸 Español'],
                    ['value' => 'fr', 'label' => '🇫🇷 Français'],
                    ['value' => 'it', 'label' => '🇮🇹 Italiano'],
                    ['value' => 'pt-BR', 'label' => '🇧🇷 Português (BR)'],
                    ['value' => 'nl', 'label' => '🇳🇱 Nederlands'],
                    ['value' => 'pl', 'label' => '🇵🇱 Polski'],
                ])
                ->frontend(),

            ExtensionSettingDefinition::make('show_header_dropdown', 'show_header_dropdown', true)
                ->label('Header Language Selector / Üst Menü Dil Seçici')
                ->help('Display a quick language selector dropdown with flags in the top navigation bar.')
                ->field('toggle')
                ->frontend(),

            ExtensionSettingDefinition::make('allow_user_override', 'allow_user_override', true)
                ->label('Allow User Override / Kullanıcı Dilini Seçebilsin')
                ->help('Allow individual users to choose their own personal language preference.')
                ->field('toggle')
                ->frontend(),
        ]));

        $this->registerApiRoutes();
    }
}
