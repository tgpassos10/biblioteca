<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operacoes_auditoria', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ator_id')->index();
            $table->string('acao', 30);
            $table->string('entidade', 30);
            $table->unsignedBigInteger('registro_id');
            $table->timestamp('ocorrido_em');
            $table->index(['entidade', 'registro_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operacoes_auditoria');
    }
};
