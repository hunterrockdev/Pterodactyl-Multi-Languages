<?php

declare(strict_types=1);

namespace Hunterrock\MultiLanguage;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;
use Pterodactyl\Extensions\ExtensionProvider;
use Pterodactyl\Http\Controllers\Api\Admin\LanguagesController;
use Pterodactyl\Http\Requests\Api\Admin\GetLanguagesRequest;
use Pterodactyl\Http\Requests\Api\Admin\Settings\UpdateGeneralSettingsRequest;
use Pterodactyl\Models\ExtensionSetting;
use Pterodactyl\Models\Setting;
use Pterodactyl\Services\Extensions\ExtensionSettingDefinition;
use Pterodactyl\Services\Extensions\ExtensionSettingsDefinition;
use Throwable;

class MultiLanguageServiceProvider extends ExtensionProvider
{
    public const SUPPORTED_LANGUAGES = [
        'en' => '🇬🇧 English',
        'tr' => '🇹🇷 Türkçe',
        'de' => '🇩🇪 Deutsch',
        'ru' => '🇷🇺 Русский',
        'ar' => '🇸🇦 العربية',
        'es' => '🇪🇸 Español',
        'fr' => '🇫🇷 Français',
        'it' => '🇮🇹 Italiano',
        'pt-BR' => '🇧🇷 Português (BR)',
        'nl' => '🇳🇱 Nederlands',
        'pl' => '🇵🇱 Polski',
    ];

    private static bool $syncing = false;

    /**
     * Register extension settings and API routes.
     * Settings defined here are rendered in Admin -> Extensions -> Settings icon.
     * Marked ->frontend(), the config is passed to the frontend bundle via ctx.config.
     */
    public function register(): void
    {
        $options = [];
        foreach (self::SUPPORTED_LANGUAGES as $code => $label) {
            $options[] = ['value' => $code, 'label' => $label];
        }

        $this->registerSettings(new ExtensionSettingsDefinition($this->settings(), [
            ExtensionSettingDefinition::make('default_language', 'default_language', 'en')
                ->label('Default Language / Varsayılan Dil')
                ->help('Global fallback language for all panels, login screens, and new users.')
                ->field('select', $options)
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

        // Bind Admin LanguagesController and UpdateGeneralSettingsRequest so /admin/settings
        // ("Default Language" / "VARSAYILAN DİL") natively lists and validates all 11 languages.
        $this->app->bind(LanguagesController::class, function ($app) {
            return new class extends LanguagesController {
                public function __invoke(GetLanguagesRequest $request): JsonResponse
                {
                    $core = $this->getAvailableLanguages(true);

                    return new JsonResponse(MultiLanguageServiceProvider::SUPPORTED_LANGUAGES + $core);
                }
            };
        });

        $this->app->bind(UpdateGeneralSettingsRequest::class, function ($app) {
            return new class extends UpdateGeneralSettingsRequest {
                public function getAvailableLanguages(bool $localize = false): array
                {
                    return array_merge(parent::getAvailableLanguages($localize), MultiLanguageServiceProvider::SUPPORTED_LANGUAGES);
                }
            };
        });

        // Expose global 'multi-language' service in Laravel container for third-party extensions
        $this->app->singleton('multi-language', fn () => $this);
    }

    /**
     * Global helper for other extensions to retrieve the panel's default language.
     */
    public function getDefaultLocale(): string
    {
        $extLocale = $this->settings()->get('default_language');
        if (is_string($extLocale) && array_key_exists($extLocale, self::SUPPORTED_LANGUAGES)) {
            return $extLocale;
        }
        $panelLocale = config('app.locale', 'en');

        return is_string($panelLocale) ? $panelLocale : 'en';
    }

    /**
     * Global helper for other extensions to retrieve the active user's or panel's language.
     */
    public function getActiveLocale(): string
    {
        $user = auth()->user();
        if ($user && !empty($user->language) && is_string($user->language)) {
            return $user->language;
        }

        return $this->getDefaultLocale();
    }

    /**
     * Returns all supported language codes and labels.
     *
     * @return array<string, string>
     */
    public function getSupportedLanguages(): array
    {
        return self::SUPPORTED_LANGUAGES;
    }

    /**
     * Boot integration with core Panel Settings (/admin/settings -> Default Language).
     */
    public function boot(): void
    {
        // 1. Ensure language directories exist in resources/lang so AvailableLanguages trait
        // natively discovers all 11 languages across Settings, Users, and API validators.
        foreach (array_keys(self::SUPPORTED_LANGUAGES) as $code) {
            $dir = resource_path('lang/' . $code);
            if (!File::isDirectory($dir)) {
                try {
                    File::makeDirectory($dir, 0755, true);
                } catch (Throwable) {
                    // Ignore if filesystem is read-only; container bindings above still work.
                }
            }
        }

        // 2. Initial synchronization between Panel Settings (app:locale) and Extension default_language
        try {
            $panelLocale = Setting::fetch('settings::app:locale') ?: config('app.locale', 'en');
            $extLocale = $this->settings()->get('default_language');

            if (is_string($panelLocale) && array_key_exists($panelLocale, self::SUPPORTED_LANGUAGES) && $panelLocale !== 'en' && (!is_string($extLocale) || $extLocale === 'en')) {
                self::$syncing = true;
                $this->settings()->set('default_language', $panelLocale);
                self::$syncing = false;
            } elseif (is_string($extLocale) && array_key_exists($extLocale, self::SUPPORTED_LANGUAGES) && $extLocale !== 'en' && $panelLocale === 'en') {
                self::$syncing = true;
                Setting::put('settings::app:locale', $extLocale);
                config(['app.locale' => $extLocale]);
                self::$syncing = false;
            }
        } catch (Throwable) {
            self::$syncing = false;
        }

        // 3. Two-way live sync: When admin updates "Default Language" in /admin/settings
        Setting::saved(function (Setting $setting): void {
            if (self::$syncing || $setting->key !== 'settings::app:locale') {
                return;
            }

            $val = (string) $setting->value;
            if (array_key_exists($val, self::SUPPORTED_LANGUAGES)) {
                try {
                    self::$syncing = true;
                    $this->settings()->set('default_language', $val);
                    config(['app.locale' => $val]);
                } catch (Throwable) {
                } finally {
                    self::$syncing = false;
                }
            }
        });

        // 4. Two-way live sync: When admin updates "default_language" in Extension Settings
        ExtensionSetting::saved(function (ExtensionSetting $row): void {
            if (self::$syncing || $row->extension !== 'multi-language' || $row->key !== 'default_language') {
                return;
            }

            try {
                self::$syncing = true;
                $val = $this->settings()->get('default_language', 'en');
                if (is_string($val) && array_key_exists($val, self::SUPPORTED_LANGUAGES)) {
                    Setting::put('settings::app:locale', $val);
                    config(['app.locale' => $val]);
                }
            } catch (Throwable) {
            } finally {
                self::$syncing = false;
            }
        });
    }
}
