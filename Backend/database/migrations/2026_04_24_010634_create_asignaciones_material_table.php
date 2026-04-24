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
        Schema::create('asignaciones_material', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained('materiales_apoyo')->cascadeOnDelete();
            $table->foreignId('estudiante_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asignaciones_material');
    }
};
