<?php

namespace App\Http\Controllers;

use App\Models\Emprestimo;
use Illuminate\Http\Request;

class EmprestimoController extends Controller
{
    // LISTAR TODOS OS EMPRÉSTIMOS
    public function index()
    {
        $emprestimos = Emprestimo::with(['usuario', 'livro'])->get();

        return response()->json($emprestimos);
    }

    // CADASTRAR NOVO EMPRÉSTIMO
    public function store(Request $request)
    {
        $dados = $request->validate([
            'usuario_id' => 'required|exists:users,id',
            'livro_id' => 'required|exists:livros,id',
            'data_emprestimo' => 'required|date',
            'data_prevista_devolucao' => 'required|date|after_or_equal:data_emprestimo',
            'data_devolucao' => 'nullable|date',
            'status' => 'nullable|string|max:50',
        ]);

        $emprestimo = Emprestimo::create($dados);

        $emprestimo->load(['usuario', 'livro']);

        return response()->json([
            'mensagem' => 'Empréstimo cadastrado com sucesso!',
            'emprestimo' => $emprestimo
        ], 201);
    }

    // MOSTRAR UM EMPRÉSTIMO
    public function show(string $id)
    {
        $emprestimo = Emprestimo::with(['usuario', 'livro'])->find($id);

        if (!$emprestimo) {
            return response()->json([
                'mensagem' => 'Empréstimo não encontrado.'
            ], 404);
        }

        return response()->json($emprestimo);
    }

    // ATUALIZAR EMPRÉSTIMO
    public function update(Request $request, string $id)
    {
        $emprestimo = Emprestimo::find($id);

        if (!$emprestimo) {
            return response()->json([
                'mensagem' => 'Empréstimo não encontrado.'
            ], 404);
        }

        $dados = $request->validate([
            'usuario_id' => 'sometimes|required|exists:users,id',
            'livro_id' => 'sometimes|required|exists:livros,id',
            'data_emprestimo' => 'sometimes|required|date',
            'data_prevista_devolucao' => 'sometimes|required|date',
            'data_devolucao' => 'nullable|date',
            'status' => 'sometimes|required|string|max:50',
        ]);

        $emprestimo->update($dados);

        $emprestimo->load(['usuario', 'livro']);

        return response()->json([
            'mensagem' => 'Empréstimo atualizado com sucesso!',
            'emprestimo' => $emprestimo
        ]);
    }

    // EXCLUIR EMPRÉSTIMO
    public function destroy(string $id)
    {
        $emprestimo = Emprestimo::find($id);

        if (!$emprestimo) {
            return response()->json([
                'mensagem' => 'Empréstimo não encontrado.'
            ], 404);
        }

        $emprestimo->delete();

        return response()->json([
            'mensagem' => 'Empréstimo excluído com sucesso!'
        ]);
    }
}
