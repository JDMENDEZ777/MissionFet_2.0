<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // 1. Agregar campo de firma a la tabla de usuarios
        if (!Schema::hasColumn('users', 'firma')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('firma')->nullable();
            });
        }

        // 2. Agregar columnas a pasantias
        Schema::table('pasantias', function (Blueprint $table) {
            if (!Schema::hasColumn('pasantias', 'acta_inicio')) {
                $table->jsonb('acta_inicio')->nullable();
            }
            if (!Schema::hasColumn('pasantias', 'plan_trabajo')) {
                $table->jsonb('plan_trabajo')->nullable();
            }
            if (!Schema::hasColumn('pasantias', 'firma_supervisor')) {
                $table->string('firma_supervisor')->nullable();
            }
        });

        // 3. Crear tabla pasantia_asistencias
        if (!Schema::hasTable('pasantia_asistencias')) {
            Schema::create('pasantia_asistencias', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pasantia_id')->constrained('pasantias')->onDelete('cascade');
                $table->integer('semana');
                $table->date('fecha_inicio');
                $table->date('fecha_fin');
                $table->text('actividad');
                $table->decimal('horas', 4, 1);
                $table->string('evidencia')->nullable();
                $table->string('estado', 20)->default('pendiente');
                $table->text('comentario_tutor')->nullable();
                $table->timestamps();
            });
        }

        // 4. Crear tabla pasantia_evaluaciones
        if (!Schema::hasTable('pasantia_evaluaciones')) {
            Schema::create('pasantia_evaluaciones', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pasantia_id')->constrained('pasantias')->onDelete('cascade');
                $table->integer('corte'); // 1 = 40%, 2 = 60%

                // Actitudinales (9 notas)
                $table->decimal('nota_act_1', 2, 1)->nullable();
                $table->decimal('nota_act_2', 2, 1)->nullable();
                $table->decimal('nota_act_3', 2, 1)->nullable();
                $table->decimal('nota_act_4', 2, 1)->nullable();
                $table->decimal('nota_act_5', 2, 1)->nullable();
                $table->decimal('nota_act_6', 2, 1)->nullable();
                $table->decimal('nota_act_7', 2, 1)->nullable();
                $table->decimal('nota_act_8', 2, 1)->nullable();
                $table->decimal('nota_act_9', 2, 1)->nullable();
                $table->decimal('promedio_actitudinal', 3, 2)->nullable();

                // Procedimentales (9 notas)
                $table->decimal('nota_proc_1', 2, 1)->nullable();
                $table->decimal('nota_proc_2', 2, 1)->nullable();
                $table->decimal('nota_proc_3', 2, 1)->nullable();
                $table->decimal('nota_proc_4', 2, 1)->nullable();
                $table->decimal('nota_proc_5', 2, 1)->nullable();
                $table->decimal('nota_proc_6', 2, 1)->nullable();
                $table->decimal('nota_proc_7', 2, 1)->nullable();
                $table->decimal('nota_proc_8', 2, 1)->nullable();
                $table->decimal('nota_proc_9', 2, 1)->nullable();
                $table->decimal('promedio_procedimental', 3, 2)->nullable();

                // Cognitivos (6 notas)
                $table->decimal('nota_cog_inf_1', 2, 1)->nullable();
                $table->decimal('nota_cog_inf_2', 2, 1)->nullable();
                $table->decimal('nota_cog_pro_1', 2, 1)->nullable();
                $table->decimal('nota_cog_pro_2', 2, 1)->nullable();
                $table->decimal('nota_cog_dom_1', 2, 1)->nullable();
                $table->decimal('nota_cog_dom_2', 2, 1)->nullable();
                $table->decimal('promedio_cognitivo', 3, 2)->nullable();

                // Ponderado
                $table->decimal('nota_corte', 3, 2)->nullable();
                
                $table->text('comentarios')->nullable();
                $table->timestamps();

                $table->unique(['pasantia_id', 'corte']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('pasantia_evaluaciones');
        Schema::dropIfExists('pasantia_asistencias');
        
        Schema::table('pasantias', function (Blueprint $table) {
            $table->dropColumn(['acta_inicio', 'plan_trabajo', 'firma_supervisor']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('firma');
        });
    }
};
