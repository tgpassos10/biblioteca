<?php

use App\Http\Controllers\EmprestimoController;
use App\Http\Controllers\LivroController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// CRUD DE LIVROS
Route::apiResource('livros', LivroController::class);
Route::apiResource('emprestimos', EmprestimoController::class);