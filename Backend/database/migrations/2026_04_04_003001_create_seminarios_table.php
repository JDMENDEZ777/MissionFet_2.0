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
    Schema::create('seminarios', function (Blueprint $table) {
        $table->id();
        $table->string('nombre');
        $table->text('descripcion')->nullable();
        $table->date('fecha_realizacion');
        $table->integer('cupos_totales')->default(50);
        $table->enum('estado', ['activo', 'finalizado'])->default('activo');
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
