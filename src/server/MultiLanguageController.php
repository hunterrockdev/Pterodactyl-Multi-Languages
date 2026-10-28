<?php

declare(strict_types=1);

namespace Hunterrock\MultiLanguage;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Pterodactyl\Models\Setting;
use Pterodactyl\Services\Extensions\ExtensionRepository;
use Pterodactyl\Services\Extensions\ExtensionSettings;
use Throwable;

class MultiLanguageController extends Controller
{
    private const ALLOWED_LANGUAGES = [
        'en', 'tr', 'de', 'ru', 'ar', 'es', 'fr', 'it', 'pt-BR', 'nl', 'pl'
    ];

    private function settings(): ExtensionSettings
    {
        return app(ExtensionRepository::class)->settings('multi-language');
    }

    /**
     * Returns general language configuration and current user's preference.
     */
    public function getData(Request $request): JsonResponse
    {
        $settings = $this->settings();
        $panelLocale = config('app.locale', 'en');
        $extDefault = $settings->get('default_language', $panelLocale);
        $defaultLang = (is_string($panelLocale) && $panelLocale !== 'en' && in_array($panelLocale, self::ALLOWED_LANGUAGES, true))
            ? $panelLocale
            : (is_string($extDefault) ? $extDefault : 'en');
        $user = $request->user();

        return response()->json([
            'data' => [
                'default_language' => $defaultLang,
                'show_header_dropdown' => (bool) $settings->get('show_header_dropdown', true),
                'allow_user_override' => (bool) $settings->get('allow_user_override', true),
                'user_language' => $user?->language ?: null,
                'available_languages' => self::ALLOWED_LANGUAGES,
            ],
        ]);
    }

    /**
     * Updates the authenticated user's language preference in the database.
     */
    public function updatePreference(Request $request): JsonResponse
    {
        $language = $request->string('language')->toString();

        if (!in_array($language, self::ALLOWED_LANGUAGES, true)) {
            return response()->json([
                'error' => 'Invalid language code. Supported: ' . implode(', ', self::ALLOWED_LANGUAGES),
            ], 422);
        }

        $user = $request->user();
        if ($user) {
            $user->language = $language;
            $user->save();
        }

        return response()->json([
            'success' => true,
            'language' => $language,
        ]);
    }

    /**
     * Admin action to update extension settings and sync with Panel Settings (app:locale).
     */
    public function saveSettings(Request $request): JsonResponse
    {
        $defaultLang = $request->input('default_language');
        if (is_string($defaultLang) && in_array($defaultLang, self::ALLOWED_LANGUAGES, true)) {
            $this->settings()->set('default_language', $defaultLang);
            try {
                Setting::put('settings::app:locale', $defaultLang);
                config(['app.locale' => $defaultLang]);
            } catch (Throwable) {
            }
        }

        if ($request->has('show_header_dropdown')) {
            $this->settings()->set('show_header_dropdown', (bool) $request->input('show_header_dropdown'));
        }

        if ($request->has('allow_user_override')) {
            $this->settings()->set('allow_user_override', (bool) $request->input('allow_user_override'));
        }

        return response()->json(['success' => true]);
    }
}
