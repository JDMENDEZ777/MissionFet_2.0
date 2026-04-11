<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración: Archivos adjuntos de un material de apoyo
 *
 * Cada material de apoyo puede tener uno o más
 * archivos descargables (PDF, Word, video, etc.).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('archivos_material', function (Blueprint $table) {
            $table->id();

            // Relación con el material de apoyo
            $table->foreignId('material_id')
                  ->constrained('materiales_apoyo')
                  ->cascadeOnDelete();

            $table->string('nombre_archivo');       // Nombre original del archivo
            $table->string('ruta_archivo');         // Ruta en storage
            $table->string('tipo_archivo');         // MIME type
            $table->integer('tamano_archivo');      // Tamaño en bytes

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('archivos_material');
    }
};
