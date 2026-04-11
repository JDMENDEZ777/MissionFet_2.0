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
        // 1. Forzamos el borrado de las tablas viejas (CASCADE asegura que no haya errores de relaciones)
        \Illuminate\Support\Facades\DB::statement('DROP TABLE IF EXISTS inscripciones_seminario CASCADE');
        \Illuminate\Support\Facades\DB::statement('DROP TABLE IF EXISTS seminarios CASCADE');

        // 2. Ahora sí, creamos la tabla limpia
        Schema::create('seminarios', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('descripcion');
            $table->date('fecha');
            $table->time('hora');
            $table->string('modalidad'); 
            $table->string('lugar');
            $table->integer('cupos')->default(30);
            
            // Relación con la tabla users (el tutor)
            $table->foreignId('tutor_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->string('archivo_guia')->nullable();
            $table->string('estado')->default('activo'); 
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seminarios');
    }
};
