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
        Schema::table('clases_virtuales', function (Blueprint $table) {
            $table->string('url_grabacion', 255)->nullable()->after('enlace');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clases_virtuales', function (Blueprint $table) {
            $table->dropColumn('url_grabacion');
        });
    }
};
