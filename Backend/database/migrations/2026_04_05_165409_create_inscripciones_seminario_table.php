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
        Schema::create('inscripciones_seminario', function (Blueprint $table) {
            $table->id();
            
            // Relación con el seminario y el estudiante
            $table->foreignId('seminario_id')->constrained('seminarios')->cascadeOnDelete();
            $table->foreignId('estudiante_id')->constrained('users')->cascadeOnDelete();
            
            $table->string('estado')->default('inscrito'); // inscrito, aprobado, rechazado, finalizado
            $table->boolean('asistencia')->default(false);
            $table->decimal('nota', 3, 1)->nullable(); // Notas de 0.0 a 5.0
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inscripciones_seminario');
    }
};
