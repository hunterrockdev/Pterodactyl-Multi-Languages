<?php
declare(strict_types=1);

$dir = __DIR__;
$manifestPath = $dir . DIRECTORY_SEPARATOR . 'extension.json';

if (!file_exists($manifestPath)) {
    fwrite(STDERR, "Hata: extension.json bulunamadı: $dir\n");
    exit(1);
}

$manifest = json_decode((string) file_get_contents($manifestPath), true);
if (!$manifest || empty($manifest['id']) || empty($manifest['version'])) {
    fwrite(STDERR, "Hata: Geçersiz extension.json dosyası\n");
    exit(1);
}

$id = $manifest['id'];
$version = $manifest['version'];
$outputName = "{$id}-{$version}.pteroext";
$outputPath = $dir . DIRECTORY_SEPARATOR . $outputName;

$clientJs = $dir . DIRECTORY_SEPARATOR . 'dist' . DIRECTORY_SEPARATOR . 'client.js';
if (!file_exists($clientJs)) {
    fwrite(STDERR, "Hata: dist/client.js bulunamadı. Önce 'npm run build' çalıştırın.\n");
    exit(1);
}

if (file_exists($outputPath)) {
    unlink($outputPath);
}

$zip = new ZipArchive();
if ($zip->open($outputPath, ZipArchive::CREATE | ZipArchive::EXCL) !== true) {
    fwrite(STDERR, "Hata: Arşiv oluşturulamadı: $outputPath\n");
    exit(1);
}

// 1. extension.json ekle
$zip->addFile($manifestPath, 'extension.json');

// 2. composer.json varsa ekle
if (file_exists($dir . DIRECTORY_SEPARATOR . 'composer.json')) {
    $zip->addFile($dir . DIRECTORY_SEPARATOR . 'composer.json', 'composer.json');
}

// 3. dist/ dosyalarını ekle (.map hariç)
$distDir = $dir . DIRECTORY_SEPARATOR . 'dist';
if (is_dir($distDir)) {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($distDir, RecursiveDirectoryIterator::SKIP_DOTS)
    );
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            if ($file->getExtension() === 'map') {
                continue;
            }
            $relative = 'dist/' . str_replace('\\', '/', substr($file->getPathname(), strlen($distDir) + 1));
            $zip->addFile($file->getPathname(), $relative);
        }
    }
}

// 4. src/server/ PHP dosyalarını ekle
$serverDir = $dir . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'server';
if (is_dir($serverDir)) {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($serverDir, RecursiveDirectoryIterator::SKIP_DOTS)
    );
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $relative = 'src/server/' . str_replace('\\', '/', substr($file->getPathname(), strlen($serverDir) + 1));
            $zip->addFile($file->getPathname(), $relative);
        }
    }
}

// 4b. routes/ API route dosyalarını ekle
$routesDir = $dir . DIRECTORY_SEPARATOR . 'routes';
if (is_dir($routesDir)) {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($routesDir, RecursiveDirectoryIterator::SKIP_DOTS)
    );
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $relative = 'routes/' . str_replace('\\', '/', substr($file->getPathname(), strlen($routesDir) + 1));
            $zip->addFile($file->getPathname(), $relative);
        }
    }
}

// 5. resources/lang dosyaları varsa ekle
$langDir = $dir . DIRECTORY_SEPARATOR . 'resources' . DIRECTORY_SEPARATOR . 'lang';
if (is_dir($langDir)) {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($langDir, RecursiveDirectoryIterator::SKIP_DOTS)
    );
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $relative = 'resources/lang/' . str_replace('\\', '/', substr($file->getPathname(), strlen($langDir) + 1));
            $zip->addFile($file->getPathname(), $relative);
        }
    }
}

$zip->close();

$size = filesize($outputPath);
echo "BAŞARILI: {$id} v{$version} paketi oluşturuldu:\n";
echo "  Dosya: {$outputPath} ({$size} bayt)\n";
