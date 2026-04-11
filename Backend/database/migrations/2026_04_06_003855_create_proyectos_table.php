<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
    {
        // 1. Forzamos el borrado de las tablas viejas (CASCADE evita errores de llaves foráneas)
        \Illuminate\Support\Facades\DB::statement('DROP TABLE IF EXISTS estudiantes_proyecto CASCADE');
        \Illuminate\Support\Facades\DB::statement('DROP TABLE IF EXISTS proyectos CASCADE');

        // 2. Ahora sí, creamos la tabla limpia
        Schema::create('proyectos', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('descripcion');
            $table->string('archivo_proyecto')->nullable();
            $table->string('estado')->default('propuesto'); // propuesto, en_revision, aprobado, finalizado
            $table->string('tipo')->default('proyecto');
            
            // Tutor asignado
            $table->foreignId('tutor_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proyectos');
    }
};
