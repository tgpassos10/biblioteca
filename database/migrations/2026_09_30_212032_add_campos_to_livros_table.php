<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('livros', function (Blueprint $table) {
            $table->string('titulo');
            $table->string('autor');
            $table->string('genero');
            $table->string('isbn', 20)->unique();
            $table->string('capa')->nullable();
            $table->text('sinopse')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('livros', function (Blueprint $table) {
            $table->dropColumn([
                'titulo',
                'autor',
                'genero',
                'isbn',
                'capa',
                'sinopse'
            ]);
        });
    }
};
