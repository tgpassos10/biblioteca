<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'welcome')->name('home');

Route::middleware(['auth', 'can:acessar-biblioteca', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return redirect()->away(config('app.frontend_url'));
    })->name('dashboard');
});

require __DIR__.'/settings.php';
