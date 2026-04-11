<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración: Materiales de Apoyo del Seminario
 *
 * El tutor puede subir recursos de apoyo (documentos,
 * videos, enlaces) para los estudiantes del seminario.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materiales_apoyo', function (Blueprint $table) {
            $table->id();

            // Seminario al cual pertenece el material
            $table->foreignId('seminario_id')
                  ->constrained('seminarios')
                  ->cascadeOnDelete();

            // Usuario (tutor) que subió el material
            $table->foreignId('creado_por')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('titulo');
            $table->text('descripcion')->nullable();

            // Tipo: video, documento, otro
            $table->string('tipo')->default('documento');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materiales_apoyo');
    }
};
