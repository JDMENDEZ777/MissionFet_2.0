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
    Schema::create('solicitudes_registro', function (Blueprint $table) {
        $table->id(); // Crea el ID serial autoincremental
        $table->string('nombre', 100);
        $table->string('email', 100)->unique();
        $table->string('password');
        $table->string('rol', 20); // estudiante o tutor
        $table->string('documento', 20);
        $table->string('codigo_estudiante', 20)->nullable();
        $table->string('opcion_grado', 20)->nullable(); // seminario, proyecto, pasantia
        $table->string('estado', 20)->default('pendiente'); // pendiente, aprobado, rechazado
        $table->timestamps(); // Crea automaticamente created_at y updated_at
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('solicitudes_registro');
    }
};
