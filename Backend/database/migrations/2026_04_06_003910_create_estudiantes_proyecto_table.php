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
     Schema::create('estudiantes_proyecto', function (Blueprint $table) {
         $table->id();
         $table->foreignId('proyecto_id')->constrained('proyectos')->cascadeOnDelete();
         $table->foreignId('estudiante_id')->constrained('users')->cascadeOnDelete();
         $table->string('rol_en_proyecto')->default('miembro'); // líder, miembro
         $table->timestamps();
     });
 }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estudiantes_proyecto');
    }
};
