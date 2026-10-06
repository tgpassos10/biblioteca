<?php

namespace App\Http\Controllers;

use App\Models\Livro;
use Illuminate\Http\Request;

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

        $livro = Livro::create($dados);

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

        $livro->update($dados);

        return response()->json([
            'mensagem' => 'Livro atualizado com sucesso!',
            'livro' => $livro
        ]);
    }

    // EXCLUIR UM LIVRO
    public function destroy(string $id)
    {
        $livro = Livro::find($id);

        if (!$livro) {
            return response()->json([
                'mensagem' => 'Livro não encontrado.'
            ], 404);
        }

        $livro->delete();

        return response()->json([
            'mensagem' => 'Livro excluído com sucesso!'
        ]);
    }
}