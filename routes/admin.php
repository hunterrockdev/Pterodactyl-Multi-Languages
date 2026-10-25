<?php

use Illuminate\Support\Facades\Route;
use Hunterrock\MultiLanguage\MultiLanguageController;

Route::post('/settings', [MultiLanguageController::class, 'saveSettings']);
