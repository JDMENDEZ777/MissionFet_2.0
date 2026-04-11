<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración: Archivos adjuntos de una entrega de estudiante
 *
 * El estudiante puede adjuntar uno o más archivos
 * al entregar una actividad.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('archivos_entrega', function (Blueprint $table) {
            $table->id();

            // Relación con la entrega del estudiante
            $table->foreignId('entrega_id')
                  ->constrained('entregas_actividad')
                  ->cascadeOnDelete();

            $table->string('nombre_archivo');          // Nombre original del archivo
            $table->string('ruta_archivo');            // Ruta en storage
            $table->string('tipo_archivo');            // MIME type
            $table->integer('tamano_archivo');         // Tamaño en bytes

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('archivos_entrega');
    }
};
