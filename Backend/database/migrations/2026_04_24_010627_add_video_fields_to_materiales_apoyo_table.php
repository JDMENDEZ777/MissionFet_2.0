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
        Schema::table('materiales_apoyo', function (Blueprint $table) {
            $table->string('plataforma')->nullable()->after('tipo');
            $table->string('enlace')->nullable()->after('plataforma');
            $table->string('thumbnail_url')->nullable()->after('enlace');
        });
    }

    public function down(): void
    {
        Schema::table('materiales_apoyo', function (Blueprint $table) {
            $table->dropColumn(['plataforma', 'enlace', 'thumbnail_url']);
        });
    }
};
