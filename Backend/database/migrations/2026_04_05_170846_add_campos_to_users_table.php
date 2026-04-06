<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Preguntamos si la columna NO existe, y solo entonces la agregamos
            if (!Schema::hasColumn('users', 'rol')) {
                $table->string('rol')->default('estudiante')->after('password');
            }
            if (!Schema::hasColumn('users', 'documento')) {
                $table->string('documento')->nullable();
            }
            if (!Schema::hasColumn('users', 'codigo_estudiante')) {
                $table->string('codigo_estudiante')->nullable();
            }
            if (!Schema::hasColumn('users', 'telefono')) {
                $table->string('telefono')->nullable();
            }
            if (!Schema::hasColumn('users', 'opcion_grado')) {
                $table->string('opcion_grado')->nullable();
            }
            if (!Schema::hasColumn('users', 'ciclo')) {
                $table->string('ciclo')->nullable();
            }
            if (!Schema::hasColumn('users', 'estado')) {
                $table->string('estado')->default('activo');
            }
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            // Eliminar solo si existen (para cuando hagamos rollback)
            $columnas = ['rol', 'documento', 'codigo_estudiante', 'telefono', 'opcion_grado', 'ciclo', 'estado'];
            
            foreach ($columnas as $columna) {
                if (Schema::hasColumn('users', $columna)) {
                    $table->dropColumn($columna);
                }
            }
        });
    }
};