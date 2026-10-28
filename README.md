# 🌐 Pterodactyl Multi-Language Extension (`.pteroext`)

<div align="center">

[![Latest Release](https://img.shields.io/github/v/release/hunterrockdev/Pterodactyl-Multi-Languages?style=for-the-badge&color=blue)](https://github.com/hunterrockdev/Pterodactyl-Multi-Languages/releases)
[![Downloads](https://img.shields.io/github/downloads/hunterrockdev/Pterodactyl-Multi-Languages/total?style=for-the-badge&color=purple)](https://github.com/hunterrockdev/Pterodactyl-Multi-Languages/releases)
[![Pterodactyl](https://img.shields.io/badge/Pterodactyl-v2.0.0--beta-3b82f6?style=for-the-badge&logo=pterodactyl)](https://pterodactyl.io)
[![License](https://img.shields.io/github/license/hunterrockdev/Pterodactyl-Multi-Languages?style=for-the-badge&color=green)](LICENSE)
[![Languages](https://img.shields.io/badge/Languages-11%20Supported-orange?style=for-the-badge)](#-supported-languages)

**The complete, zero-configuration internationalization & multi-language extension for Pterodactyl v2.**

Empower your global users with instant language switching across the entire panel via header flag dropdowns, account localization cards, native `/admin/settings` integration, real-time dynamic text translation, and a global cross-extension language API.

[✨ Features](#-key-features) • [🌍 Languages](#-supported-languages) • [📦 Installation](#-installation) • [⚙️ Configuration](#-admin-settings) • [🔌 Developer API](#-cross-extension-developer-api) • [🛠️ Building](#-building-from-source)

</div>

---

## 🌟 Key Features

### 🚩 1. Top Navigation Quick Switcher
- **Header Slot Integration**: Mounted natively into `<Slot name="nav.items.after" />` with zero DOM tampering.
- **Flag Trigger**: Displays the active country flag and uppercase language code (e.g. `🇹🇷 TR`, `🇩🇪 DE`, `🇺🇸 EN`).
- **Instant Search**: Dropdown includes an embedded filter input to search languages by name, native name, or ISO code.
- **Real-Time Live Switching**: Switching a language immediately translates visible text without requiring a full browser refresh.

### 👤 2. User Account Preference Card
- **Account Overview Slot**: Mounted into the `/account` profile page via `<Slot name="account.overview.after" />`.
- **Responsive Card Grid**: Displays all 11 languages with flag badges, native names, and active checkmarks.
- **Instant Database Sync**: User selections are saved directly to `users.language` in the Pterodactyl database, surviving device changes and browser clears.

### ⚙️ 3. Native `/admin/settings` Integration (Two-Way Sync)
- **Native Dropdown Expansion**: Automatically populates Pterodactyl's built-in **Admin ➔ Settings ➔ General ➔ Default Language** (`settings::app:locale`) and **Admin ➔ Users** language selectors with all 11 supported languages in the same consistent order.
- **Two-Way Synchronization**: Changing the default language in either `/admin/settings` or the extension settings panel automatically synchronizes both settings and immediately updates the active panel language.

### 🧠 4. Smart Translation Engine (820+ UI Keys & Dynamic Patterns)
- **Comprehensive Coverage**: Over **820+** translated terms and phrases per language, covering server controls, console, file manager, schedules, backups, databases, network allocations, users, and administrative management (Eggs, Nodes, Mounts, Allocations, API Keys).
- **Dynamic Pattern Interpolation**: Translates variable counters and interactive notices on the fly (e.g. `X of Y`, `X files selected`, `X databases allocated`, `Delete "X"?`, `Restore "X"?`, `Unlock "X"?`).
- **High-Performance Architecture**: Zero-latency $O(1)$ dictionary lookups with modular language files (`src/client/dictionaries/*.ts`), lowercase lookup caching, and non-blocking DOM traversal.

### ⚡ 5. Dual-Layer Persistence, RTL Support & Cross-Extension API
- **Zero-Flash Loading**: Cached in browser `localStorage` (`ptero:language`) for instant rendering on initial page load and guest authentication screens.
- **Native RTL Support**: Automatically applies `dir="rtl"` to `<html>` for Right-to-Left languages like Arabic (`ar`).
- **Cross-Extension Bridge**: Exposes `window.PteroMultiLang`, `<html data-ptero-lang="...">`, and the `ptero:language-changed` CustomEvent so other Pterodactyl v2 extensions can detect and react to active language changes in real time.

---

## 🌍 Supported Languages

The extension ships with complete dictionaries for 11 languages across all core Pterodactyl namespaces (`strings`, `dashboard`, `server`, `account`, `auth`, `admin`):

| Flag | Language | Native Name | Code | Dictionary Keys | Direction |
| :---: | :--- | :--- | :---: | :---: | :---: |
| 🇺🇸 | English | English | `en` | *Baseline* | LTR |
| 🇹🇷 | Turkish | Türkçe | `tr` | 824 | LTR |
| 🇩🇪 | German | Deutsch | `de` | 824 | LTR |
| 🇷🇺 | Russian | Русский | `ru` | 824 | LTR |
| 🇸🇦 | Arabic | العربية | `ar` | 824 | RTL |
| 🇪🇸 | Spanish | Español | `es` | 824 | LTR |
| 🇫🇷 | French | Français | `fr` | 824 | LTR |
| 🇮🇹 | Italian | Italiano | `it` | 824 | LTR |
| 🇧🇷 | Portuguese (Brazil) | Português (Brasil) | `pt-BR` | 824 | LTR |
| 🇳🇱 | Dutch | Nederlands | `nl` | 824 | LTR |
| 🇵🇱 | Polish | Polski | `pl` | 824 | LTR |

---

## 📦 Installation

### Option 1: Web Installer (Recommended)
1. Download **[multi-language-1.0.1.pteroext](https://github.com/hunterrockdev/Pterodactyl-Multi-Languages/releases/latest/download/multi-language-1.0.1.pteroext)**.
2. Go to your Pterodactyl Admin panel: **Admin ➔ Extensions** (`/admin/extensions`).
3. Click the **"Install"** button in the top right.
4. Upload the downloaded `.pteroext` file.
5. Check **"Enable after install"** and confirm.

### Option 2: Artisan CLI
Download and install directly from your Pterodactyl server terminal:
```bash
curl -Lo /tmp/multi-language-1.0.1.pteroext https://github.com/hunterrockdev/Pterodactyl-Multi-Languages/releases/latest/download/multi-language-1.0.1.pteroext
php artisan p:extension:install /tmp/multi-language-1.0.1.pteroext
```

---

## ⚙️ Admin Settings

You can configure panel-wide language defaults from either location (both stay synchronized automatically):

1. **Pterodactyl General Settings (`/admin/settings`)**:
   - Use the native **Default Language** dropdown to select any of the 11 supported languages and click **Save**.
2. **Extension Settings (`Admin ➔ Extensions ➔ Multi-Language`)**:
   - **Default Language**: Set the global fallback language for login screens, new registrations, and unauthenticated sessions.
   - **Header Language Selector**: Toggle the flag dropdown in the top navigation bar on or off.
   - **Allow User Override**: Toggle whether individual users can pick and save their own language preferences.

---

## 🔌 Cross-Extension Developer API

Other Pterodactyl v2 extensions can read the active panel language and subscribe to real-time language changes without any hard dependencies:

### Frontend (TypeScript / React)
```ts
// 1. Read via Global Bridge
const currentLang = window.PteroMultiLang?.getLanguage() ?? 'en';
const langInfo = window.PteroMultiLang?.getLanguageInfo();

// Subscribe to live language switches (returns an unsubscribe function)
const unsubscribe = window.PteroMultiLang?.onLanguageChange((lang) => {
    console.log('Panel language changed to:', lang.code, lang.nativeName);
});

// 2. Or use Zero-Dependency DOM / CustomEvent API
const htmlLang = document.documentElement.getAttribute('data-ptero-lang') ?? 'en';
window.addEventListener('ptero:language-changed', (e: any) => {
    console.log('Active language code:', e.detail.code);
});
```

### Backend (PHP / Laravel)
```php
if (app()->bound('multi-language')) {
    $activeLocale = app('multi-language')->getActiveLocale();
    $defaultLocale = app('multi-language')->getDefaultLocale();
    $supported = app('multi-language')->getSupportedLanguages();
}
```

---

## 📂 Project Architecture

```
Pterodactyl-Multi-Languages/
├── extension.json                          # Extension manifest & metadata (v1.0.1)
├── pack.php                                # Automated .pteroext packager script
├── src/
│   ├── client/
│   │   ├── index.tsx                       # Slot registrations, initializers & global bridge exports
│   │   ├── LanguageSwitcher.tsx            # Header flag dropdown component
│   │   ├── AccountLanguageCard.tsx         # User profile preference card
│   │   ├── i18nManager.ts                  # Translation engine, /admin/settings sync & event bus
│   │   ├── dictionary.ts                   # Dictionary lookup & lowerCache manager
│   │   └── dictionaries/                   # Modular language dictionaries
│   │       ├── tr.ts                       # Turkish (824 keys)
│   │       ├── de.ts                       # German (824 keys)
│   │       ├── ru.ts                       # Russian (824 keys)
│   │       ├── es.ts                       # Spanish (824 keys)
│   │       ├── fr.ts                       # French (824 keys)
│   │       ├── it.ts                       # Italian (824 keys)
│   │       ├── ptBR.ts                     # Portuguese (Brazil) (824 keys)
│   │       ├── nl.ts                       # Dutch (824 keys)
│   │       ├── pl.ts                       # Polish (824 keys)
│   │       ├── ar.ts                       # Arabic (824 keys)
│   │       └── index.ts                    # Dictionary export registry
│   └── server/
│       ├── MultiLanguageServiceProvider.php # Native /admin/settings integration & two-way sync
│       └── MultiLanguageController.php      # User/admin preference endpoints & validation
```

---

## 🛠️ Building from Source

If you want to modify or compile the extension from source:

```bash
# 1. Install dependencies
npm install

# 2. Typecheck TypeScript
npm run typecheck

# 3. Build bundle with Vite
npm run build

# 4. Create the .pteroext zip archive
php pack.php
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
