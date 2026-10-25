<?php

use Illuminate\Support\Facades\Route;
use Hunterrock\MultiLanguage\MultiLanguageController;

Route::get('/data', [MultiLanguageController::class, 'getData']);
Route::post('/preference', [MultiLanguageController::class, 'updatePreference']);
