<?php

namespace App\Http\Controllers;

use App\Models\Livro;
use App\Support\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LivroController extends Controller
{
    // LISTAR TODOS OS LIVROS
    public function index()
    {
        return response()->json(Livro::all());
    }

    // CADASTRAR UM NOVO LIVRO
    public function store(Request $request)
    {
        $dados = $request->validate([
            'titulo' => 'required|string|max:255',
            'autor' => 'required|string|max:255',
            'genero' => 'required|string|max:255',
            'isbn' => 'required|string|max:20|unique:livros,isbn',
            'capa' => 'nullable|string|max:255',
            'sinopse' => 'nullable|string',
        ]);

        $livro = DB::transaction(function () use ($dados, $request) {
            $registro = Livro::create($dados);
            Auditoria::registrar($request->user()->id, 'cadastro', $registro);

            return $registro;
        });

        return response()->json([
            'mensagem' => 'Livro cadastrado com sucesso!',
            'livro' => $livro
        ], 201);
    }

    // MOSTRAR UM LIVRO ESPECÍFICO
    public function show(string $id)
    {
        $livro = Livro::find($id);

        if (!$livro) {
            return response()->json([
                'mensagem' => 'Livro não encontrado.'
            ], 404);
        }

        return response()->json($livro);
    }

    // ATUALIZAR UM LIVRO
    public function update(Request $request, string $id)
    {
        $livro = Livro::find($id);

        if (!$livro) {
            return response()->json([
                'mensagem' => 'Livro não encontrado.'
            ], 404);
        }

        $dados = $request->validate([
            'titulo' => 'sometimes|required|string|max:255',
            'autor' => 'sometimes|required|string|max:255',
            'genero' => 'sometimes|required|string|max:255',
            'isbn' => 'sometimes|required|string|max:20|unique:livros,isbn,' . $id,
            'capa' => 'nullable|string|max:255',
            'sinopse' => 'nullable|string',
        ]);

        DB::transaction(function () use ($livro, $dados, $request) {
            $livro->update($dados);
            if ($livro->wasChanged()) {
                Auditoria::registrar($request->user()->id, 'edicao', $livro);
            }
        });

        return response()->json([
            'mensagem' => 'Livro atualizado com sucesso!',
            'livro' => $livro
        ]);
    }

    // EXCLUIR UM LIVRO
    public function destroy(Request $request, string $id)
    {
        $livro = Livro::find($id);

        if (!$livro) {
            return response()->json([
                'mensagem' => 'Livro não encontrado.'
            ], 404);
        }

        DB::transaction(function () use ($livro, $request) {
            $livro->delete();
            Auditoria::registrar($request->user()->id, 'exclusao', $livro);
        });

        return response()->json([
            'mensagem' => 'Livro excluído com sucesso!'
        ]);
    }
}