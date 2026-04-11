<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración: Entregas de los Estudiantes
 *
 * Registra cada entrega que un estudiante hace
 * para una actividad específica. Solo puede haber
 * UNA entrega por estudiante por actividad.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entregas_actividad', function (Blueprint $table) {
            $table->id();

            // Relación con la actividad entregada
            $table->foreignId('actividad_id')
                  ->constrained('actividades')
                  ->cascadeOnDelete();

            // Estudiante que entregó
            $table->foreignId('estudiante_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Comentario opcional del estudiante al entregar
            $table->text('comentario')->nullable();

            // Retroalimentación del tutor al calificar
            $table->text('comentario_tutor')->nullable();

            // Nota de 0.0 a 5.0, null hasta que el tutor califique
            $table->decimal('calificacion', 4, 2)->nullable();

            // Estados del ciclo de vida de la entrega
            $table->string('estado')->default('pendiente'); // pendiente | revisado | calificado

            // Fecha en que el tutor calificó
            $table->timestamp('fecha_calificacion')->nullable();

            $table->timestamps(); // created_at = fecha de entrega

            // Garantizar que un estudiante no entregue la misma actividad dos veces
            $table->unique(['actividad_id', 'estudiante_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entregas_actividad');
    }
};
