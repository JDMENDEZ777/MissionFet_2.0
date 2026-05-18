<?php
 
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tabla de Actividades del Seminario
        Schema::create('seminario_actividades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seminario_id')->constrained('seminarios')->cascadeOnDelete();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->decimal('puntaje', 3, 1)->default(5.0); // Nota máxima (escala colombiana, e.g. 5.0)
            $table->date('fecha_limite');
            $table->time('hora_limite');
            $table->boolean('permite_entregas_tardias')->default(false);
            $table->timestamps();
        });

        // 2. Tabla de Entregas de los Estudiantes
        Schema::create('seminario_entregas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actividad_id')->constrained('seminario_actividades')->cascadeOnDelete();
            $table->foreignId('estudiante_id')->constrained('users')->cascadeOnDelete();
            $table->string('archivo')->nullable(); // Guardado físico del PDF/Word
            $table->text('comentario_estudiante')->nullable();
            $table->decimal('nota', 3, 1)->nullable(); // Nota otorgada de 0.0 a 5.0
            $table->text('comentario_tutor')->nullable(); // Feedback
            $table->timestamp('fecha_entrega')->useCurrent();
            $table->string('estado')->default('entregado'); // entregado, calificado, tarde
            $table->timestamps();

            // Un estudiante solo puede tener una entrega por actividad
            $table->unique(['actividad_id', 'estudiante_id']);
        });

        // 3. Tabla de Material de Apoyo (Recursos)
        Schema::create('seminario_recursos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seminario_id')->constrained('seminarios')->cascadeOnDelete();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->string('tipo')->default('archivo'); // archivo, enlace
            $table->string('archivo')->nullable(); // Guardado físico si es archivo
            $table->text('url')->nullable(); // URL si es un link externo
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seminario_recursos');
        Schema::dropIfExists('seminario_entregas');
        Schema::dropIfExists('seminario_actividades');
    }
};
