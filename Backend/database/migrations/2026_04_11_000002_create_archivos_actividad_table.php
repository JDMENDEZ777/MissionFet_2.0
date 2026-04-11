<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración: Archivos adjuntos de una actividad
 *
 * El tutor puede subir archivos de referencia/enunciado
 * al crear una actividad (PDFs, Word, imágenes, etc.).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('archivos_actividad', function (Blueprint $table) {
            $table->id();

            // Relación con la actividad a la que pertenece el archivo
            $table->foreignId('actividad_id')
                  ->constrained('actividades')
                  ->cascadeOnDelete();

            $table->string('nombre_archivo');       // Nombre original del archivo
            $table->string('ruta_archivo');         // Ruta en storage (ej: actividades/archivo.pdf)
            $table->string('tipo_archivo')->default(''); // MIME type
            $table->integer('tamano_archivo')->default(0); // Tamaño en bytes

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('archivos_actividad');
    }
};
