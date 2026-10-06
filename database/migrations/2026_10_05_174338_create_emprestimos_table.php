<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emprestimos', function (Blueprint $table) {
            $table->id();

            // Usuário que pegou o livro
            $table->foreignId('usuario_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Livro emprestado
            $table->foreignId('livro_id')
                ->constrained('livros')
                ->cascadeOnDelete();

            // Datas do empréstimo
            $table->date('data_emprestimo');
            $table->date('data_prevista_devolucao');
            $table->date('data_devolucao')->nullable();

            // Ex.: emprestado, devolvido, atrasado
            $table->string('status')->default('emprestado');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emprestimos');
    }
};
