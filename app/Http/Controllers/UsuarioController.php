<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UsuarioController extends Controller
{
    public function index()
    {
        return User::query()->where('funcionario', false)->orderBy('name')->get(['id', 'name']);
    }

    public function store(Request $request)
    {
        $dados = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        ]);

        $usuario = DB::transaction(function () use ($request, $dados) {
            $usuario = User::create([...$dados, 'password' => Str::random(48)]);
            Auditoria::registrar($request->user()->id, 'cadastro', $usuario);

            return $usuario;
        });

        return response()->json($usuario->only(['id', 'name']), 201);
    }
}
