<?php

use App\Http\Controllers\EmprestimoController;
use App\Http\Controllers\LivroController;
use App\Http\Controllers\UsuarioController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware(['auth:sanctum', 'can:acessar-biblioteca']);

Route::middleware(['auth:sanctum', 'can:acessar-biblioteca'])->group(function () {
    Route::get('usuarios', [UsuarioController::class, 'index']);
    Route::post('usuarios', [UsuarioController::class, 'store']);
    Route::apiResource('livros', LivroController::class);
    Route::apiResource('emprestimos', EmprestimoController::class);
});
