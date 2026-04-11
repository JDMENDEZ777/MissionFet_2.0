<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración: Clases Virtuales del Seminario
 *
 * El tutor puede programar sesiones de clase virtual
 * con plataforma, enlace, fecha y duración.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clases_virtuales', function (Blueprint $table) {
            $table->id();

            // Seminario al que pertenece esta clase
            $table->foreignId('seminario_id')
                  ->constrained('seminarios')
                  ->cascadeOnDelete();

            // Tutor que programa la clase
            $table->foreignId('tutor_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('titulo');
            $table->text('descripcion')->nullable();

            $table->date('fecha');
            $table->time('hora');

            // Duración en minutos (ej: 90 = 1h30m)
            $table->integer('duracion')->default(60);

            // Plataforma: Zoom, Meet, Teams, etc.
            $table->string('plataforma');

            // URL de acceso a la clase
            $table->string('enlace');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clases_virtuales');
    }
};
