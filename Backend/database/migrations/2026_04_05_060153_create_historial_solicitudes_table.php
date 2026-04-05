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
        Schema::create('historial_solicitudes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('solicitud_id')->nullable(); // Guardamos el ID original por referencia
            $table->string('nombre');
            $table->string('email');
            $table->string('documento');
            $table->string('rol');
            $table->string('codigo_estudiante')->nullable();
            $table->string('ciclo')->nullable();
            $table->string('opcion_grado')->nullable();
            $table->string('nombre_proyecto')->nullable();
            $table->string('nombre_empresa')->nullable();
            $table->enum('estado_final', ['aprobado', 'rechazado']);
            
            // ¿Quién fue el administrador que hizo esto?
            $table->foreignId('resuelto_por')->nullable()->constrained('users')->onDelete('set null');
            
            $table->timestamp('fecha_resolucion')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historial_solicitudes');
    }
};
