<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return redirect()->away('http://localhost:5175');
    })->name('dashboard');
});

require __DIR__.'/settings.php';

Route::get('/sair', function (\Illuminate\Http\Request $request) {

    \Illuminate\Support\Facades\Auth::guard('web')->logout();

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/login');
});