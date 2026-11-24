<?php

namespace App\Http\Controllers;

use App\Models\Emprestimo;
use App\Models\Livro;
use App\Support\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

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
            'usuario_id' => ['required', 'integer', Rule::exists('users', 'id')->where(fn ($query) => $query->where('funcionario', false))],
            'livro_id' => 'required|integer|exists:livros,id',
            'data_emprestimo' => 'required|date',
            'data_prevista_devolucao' => 'required|date|after_or_equal:data_emprestimo',
            'data_devolucao' => 'nullable|date',
            'status' => 'nullable|string|max:50',
        ]);

        $emprestimo = DB::transaction(function () use ($dados, $request) {
            if (empty($dados['data_devolucao'])) {
                $this->verificarDisponibilidade($dados['livro_id']);
            }
            $registro = Emprestimo::create($dados);
            Auditoria::registrar($request->user()->id, 'cadastro', $registro);

            return $registro;
        });

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
            'usuario_id' => ['sometimes', 'required', 'integer', Rule::exists('users', 'id')->where(fn ($query) => $query->where('funcionario', false))],
            'livro_id' => 'sometimes|required|integer|exists:livros,id',
            'data_emprestimo' => 'sometimes|required|date',
            'data_prevista_devolucao' => 'sometimes|required|date',
            'data_devolucao' => 'nullable|date',
            'status' => 'sometimes|required|string|max:50',
        ]);

        $emprestimo = DB::transaction(function () use ($id, $dados, $request) {
            $emprestimo = Emprestimo::query()->lockForUpdate()->findOrFail($id);
            $emprestimo->fill($dados);
            if (!$emprestimo->data_devolucao && $emprestimo->isDirty(['livro_id', 'data_devolucao'])) {
                $this->verificarDisponibilidade($emprestimo->livro_id, $emprestimo->id);
            }
            $emprestimo->save();
            if ($emprestimo->wasChanged()) {
                $acao = $emprestimo->wasChanged('data_devolucao') && $emprestimo->data_devolucao
                    ? 'devolucao'
                    : 'edicao';

                Auditoria::registrar($request->user()->id, $acao, $emprestimo);
            }

            return $emprestimo;
        });

        $emprestimo->load(['usuario', 'livro']);

        return response()->json([
            'mensagem' => 'Empréstimo atualizado com sucesso!',
            'emprestimo' => $emprestimo
        ]);
    }

    private function verificarDisponibilidade(int $livroId, ?int $ignorar = null): void
    {
        Livro::query()->lockForUpdate()->findOrFail($livroId);

        $aberto = Emprestimo::query()
            ->where('livro_id', $livroId)
            ->whereNull('data_devolucao')
            ->when($ignorar !== null, fn ($query) => $query->where('id', '<>', $ignorar));

        if ($aberto->exists()) {
            throw ValidationException::withMessages([
                'livro_id' => 'Este livro está emprestado e ainda não foi devolvido.',
            ]);
        }
    }

    // EXCLUIR EMPRÉSTIMO
    public function destroy(Request $request, string $id)
    {
        $emprestimo = Emprestimo::find($id);

        if (!$emprestimo) {
            return response()->json([
                'mensagem' => 'Empréstimo não encontrado.'
            ], 404);
        }

        DB::transaction(function () use ($emprestimo, $request) {
            $emprestimo->delete();
            Auditoria::registrar($request->user()->id, 'exclusao', $emprestimo);
        });

        return response()->json([
            'mensagem' => 'Empréstimo excluído com sucesso!'
        ]);
    }
}
