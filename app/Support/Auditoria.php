<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

final class Auditoria
{
    public static function registrar(int $ator, string $acao, Model $registro): void
    {
        DB::table('operacoes_auditoria')->insert([
            'ator_id' => $ator,
            'acao' => $acao,
            'entidade' => $registro->getTable(),
            'registro_id' => $registro->getKey(),
            'ocorrido_em' => now(),
        ]);
    }
}
