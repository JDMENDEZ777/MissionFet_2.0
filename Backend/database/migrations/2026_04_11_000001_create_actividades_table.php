<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración: Tabla de Actividades del Seminario
 *
 * Almacena las tareas/actividades que el tutor asigna
 * dentro de un seminario específico para sus estudiantes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('actividades', function (Blueprint $table) {
            $table->id();

            // Relación con el seminario al que pertenece esta actividad
            $table->foreignId('seminario_id')
                  ->constrained('seminarios')
                  ->cascadeOnDelete();

            // Tutor que creó la actividad
            $table->foreignId('tutor_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('titulo');
            $table->text('descripcion')->nullable();

            $table->date('fecha_limite');
            $table->time('hora_limite');

            // Tipo de actividad: tarea, proyecto, examen, cuestionario, investigacion
            $table->string('tipo')->default('tarea');

            // Puntaje máximo de 0.00 a 5.00 (escala colombiana)
            $table->decimal('puntaje', 5, 2)->default(5.00);

            // Si se permiten entregas después de la fecha límite
            $table->boolean('permitir_entregas_tarde')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('actividades');
    }
};
