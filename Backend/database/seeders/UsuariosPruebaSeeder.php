<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsuariosPruebaSeeder extends Seeder
{
    public function run()
    {
        // 1. El Administrador (No debe salir en ninguna lista de estudiantes/tutores)
        DB::table('users')->updateOrInsert(
            ['email' => 'admin@fet.edu.co'],
            [
                'name' => 'Super Administrador',
                'password' => Hash::make('password123'),
                'rol' => 'admin',
                'documento' => '000000000',
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        // 2. El Tutor (Solo debe salir en los selects de asignar Tutor)
        DB::table('users')->updateOrInsert(
            ['email' => 'tutor@fet.edu.co'],
            [
                'name' => 'Profesor Tutor',
                'password' => Hash::make('password123'),
                'rol' => 'tutor',
                'documento' => '111111111',
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        // 3. Estudiante para Proyectos
        DB::table('users')->updateOrInsert(
            ['email' => 'proyecto@fet.edu.co'],
            [
                'name' => 'Estudiante de Proyectos',
                'password' => Hash::make('password123'),
                'rol' => 'estudiante',
                'opcion_grado' => 'proyecto', // Clave para que salga en Proyectos
                'codigo_estudiante' => 'PROY-001',
                'documento' => '222222222',
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        // 4. Estudiante para Seminarios
        DB::table('users')->updateOrInsert(
            ['email' => 'seminario@fet.edu.co'],
            [
                'name' => 'Estudiante de Seminarios',
                'password' => Hash::make('password123'),
                'rol' => 'estudiante',
                'opcion_grado' => 'seminario', // Clave para que NO salga en Proyectos
                'codigo_estudiante' => 'SEM-001',
                'documento' => '333333333',
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now()
            ]
        );
    }
}