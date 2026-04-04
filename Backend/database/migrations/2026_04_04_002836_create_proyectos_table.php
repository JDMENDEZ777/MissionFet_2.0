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
    Schema::create('proyectos', function (Blueprint $table) {
        $table->id();
        $table->string('titulo');
        $table->text('descripcion')->nullable();
        // Relacionamos el proyecto con el usuario (estudiante) que lo sube:
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
        // El estado por defecto será pendiente hasta que el admin lo apruebe:
        $table->enum('estado', ['pendiente', 'aprobado', 'rechazado', 'corregir'])->default('pendiente');
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
