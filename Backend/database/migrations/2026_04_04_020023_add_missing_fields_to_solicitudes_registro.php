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
    Schema::table('solicitudes_registro', function (Blueprint $table) {
        // Añadimos todos los campos que el formulario está enviando
        $table->string('codigo_institucional')->nullable();
        $table->string('telefono')->nullable();
        $table->string('nombre_proyecto')->nullable();
        $table->string('nombre_empresa')->nullable();
        $table->string('ciclo')->nullable();
    });
}

public function down()
{
    Schema::table('solicitudes_registro', function (Blueprint $table) {
        $table->dropColumn(['codigo_institucional', 'telefono', 'nombre_proyecto', 'nombre_empresa', 'ciclo']);
    });
}
};
 