<?php

use App\Models\User;
use App\Models\Seminario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

// Crear Tutor
$tutor = User::firstOrCreate(
    ['email' => 'tutor@test.com'],
    [
        'name' => 'Tutor Prueba',
        'password' => Hash::make('12345678'),
        'rol' => 'tutor',
    ]
);

// Crear Estudiante
$estudiante = User::firstOrCreate(
    ['email' => 'estudiante@test.com'],
    [
        'name' => 'Estudiante Prueba',
        'password' => Hash::make('12345678'),
        'rol' => 'estudiante',
    ]
);

// Crear Administrador (por si acaso quieres entrar al panel global)
$admin = User::firstOrCreate(
    ['email' => 'admin@test.com'],
    [
        'name' => 'Admin Prueba',
        'password' => Hash::make('12345678'),
        'rol' => 'admin',
    ]
);

// Crear un Seminario asignado al tutor
$seminario = Seminario::firstOrCreate(
    ['titulo' => 'Seminario de Inteligencia Artificial'],
    [
        'descripcion' => 'Introducción a modelos generativos.',
        'fecha' => '2026-05-15',
        'hora' => '18:00:00',
        'modalidad' => 'Virtual',
        'lugar' => 'Zoom',
        'cupos' => 30,
        'tutor_id' => $tutor->id,
        'estado' => 'activo'
    ]
);

// Inscribir al estudiante en ese seminario (solo si no está inscrito)
$inscripcion = DB::table('inscripciones_seminario')->where('seminario_id', $seminario->id)->where('estudiante_id', $estudiante->id)->first();
if (!$inscripcion) {
    DB::table('inscripciones_seminario')->insert([
        'seminario_id' => $seminario->id,
        'estudiante_id' => $estudiante->id,
        'estado' => 'aprobado',
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ]);
}

echo "=============================================\n";
echo "Usuarios creados correctamente:\n";
echo "- TUTOR:      tutor@test.com       / Clave: 12345678\n";
echo "- ESTUDIANTE: estudiante@test.com  / Clave: 12345678\n";
echo "- ADMIN:      admin@test.com       / Clave: 12345678\n";
echo "=============================================\n";
