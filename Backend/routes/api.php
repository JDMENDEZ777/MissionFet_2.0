<?php

// En routes/api.php
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\AprobacionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::post('/login', [AuthController::class, 'login']);

Route::get('/dashboard-stats', [DashboardController::class, 'index'])->middleware('auth:sanctum');

Route::post('/admin/aprobar/{id}', [AprobacionController::class, 'aprobar']);

Route::post('/registro', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    // ESTUDIANTE: Panel de Proyectos
    Route::get('/estudiante/proyecto',                   [App\Http\Controllers\Estudiante\EstudianteProyectoController::class, 'index']);
    Route::post('/estudiante/proyecto/avances',          [App\Http\Controllers\Estudiante\EstudianteProyectoController::class, 'subirAvance']);
    Route::get('/estudiante/proyecto/mensajes',          [App\Http\Controllers\Estudiante\EstudianteProyectoController::class, 'getMensajes']);
    Route::post('/estudiante/proyecto/mensajes',         [App\Http\Controllers\Estudiante\EstudianteProyectoController::class, 'sendMensaje']);

    // ADMINISTRADOR
    // ... tus otras rutas ...
    Route::get('/admin/dashboard', [App\Http\Controllers\Admin\DashboardController::class, 'index']);
    Route::get('/admin/aprobaciones', [AprobacionController::class, 'index']);
    Route::post('/admin/aprobaciones/{id}/aprobar', [AprobacionController::class, 'aprobar']);
    Route::post('/admin/aprobaciones/{id}/rechazar', [AprobacionController::class, 'rechazar']);
   
    Route::get('/admin/usuarios', [App\Http\Controllers\Admin\UsuarioController::class, 'index']);
    Route::put('/admin/usuarios/{id}', [App\Http\Controllers\Admin\UsuarioController::class, 'update']);
    Route::delete('/admin/usuarios/{id}', [App\Http\Controllers\Admin\UsuarioController::class, 'destroy']);

    // Rutas de Seminarios
    Route::get('/admin/tutores', [App\Http\Controllers\Admin\SeminarioController::class, 'getTutores']);
    Route::get('/admin/seminarios', [App\Http\Controllers\Admin\SeminarioController::class, 'index']);
    Route::post('/admin/seminarios', [App\Http\Controllers\Admin\SeminarioController::class, 'store']);

    // Rutas de Inscripciones a Seminarios
    Route::get('/admin/seminarios/{id}', [App\Http\Controllers\Admin\SeminarioController::class, 'show']);
    Route::get('/admin/seminarios/{id}/disponibles', [App\Http\Controllers\Admin\SeminarioController::class, 'getEstudiantesDisponibles']);
    Route::post('/admin/seminarios/{id}/inscribir', [App\Http\Controllers\Admin\SeminarioController::class, 'inscribir']);
    Route::delete('/admin/seminarios/{id}/inscripcion/{estudiante_id}', [App\Http\Controllers\Admin\SeminarioController::class, 'eliminarInscripcion']);

    // --- RUTAS PARA EDITAR Y ELIMINAR SEMINARIO ---
    Route::put('/admin/seminarios/{id}', [App\Http\Controllers\Admin\SeminarioController::class, 'update']);
    Route::delete('/admin/seminarios/{id}', [App\Http\Controllers\Admin\SeminarioController::class, 'destroy']);

    // --- RUTAS DE PROYECTOS ---
    Route::get('/admin/proyectos/form-data', [App\Http\Controllers\Admin\ProyectoController::class, 'getFormData']);
    Route::get('/admin/proyectos', [App\Http\Controllers\Admin\ProyectoController::class, 'index']);
    Route::post('/admin/proyectos', [App\Http\Controllers\Admin\ProyectoController::class, 'store']);
    Route::post('/admin/proyectos/{id}', [App\Http\Controllers\Admin\ProyectoController::class, 'update']);
    Route::delete('/admin/proyectos/{id}', [App\Http\Controllers\Admin\ProyectoController::class, 'destroy']);

    // --- RUTAS DE PASANTIAS ---
    Route::get('/admin/pasantias/form-data', [App\Http\Controllers\Admin\PasantiaController::class, 'getFormData']);
    Route::get('/admin/pasantias', [App\Http\Controllers\Admin\PasantiaController::class, 'index']);
    Route::post('/admin/pasantias', [App\Http\Controllers\Admin\PasantiaController::class, 'store']);
    Route::post('/admin/pasantias/{id}', [App\Http\Controllers\Admin\PasantiaController::class, 'update']);
    Route::delete('/admin/pasantias/{id}', [App\Http\Controllers\Admin\PasantiaController::class, 'destroy']);

    // --- RUTAS DE REPORTES ---
    Route::get('/admin/reportes', [App\Http\Controllers\Admin\ReporteController::class, 'getMetricas']);

    // --- RUTAS DE TUTOR ---
    Route::get('/tutor/dashboard', [App\Http\Controllers\Tutor\TutorDashboardController::class, 'getStats']);

    // Panel Proyectos del Tutor
    Route::get('/tutor/proyectos',                    [App\Http\Controllers\Tutor\TutorProyectosController::class, 'index']);
    Route::get('/tutor/proyectos/pendientes',         [App\Http\Controllers\Tutor\TutorProyectosController::class, 'getPendientes']);
    Route::get('/tutor/proyectos/{id}',               [App\Http\Controllers\Tutor\TutorProyectosController::class, 'show']);
    Route::post('/tutor/proyectos/calificar',         [App\Http\Controllers\Tutor\TutorProyectosController::class, 'calificar']);
    Route::post('/tutor/proyectos/{id}/init-avances', [App\Http\Controllers\Tutor\TutorProyectosController::class, 'initAvances']);
    Route::get('/tutor/proyectos/{id}/mensajes',      [App\Http\Controllers\Tutor\TutorProyectosController::class, 'getMensajes']);
    Route::post('/tutor/proyectos/{id}/mensajes',     [App\Http\Controllers\Tutor\TutorProyectosController::class, 'sendMensaje']);


    Route::get('/admin/aprobaciones', [AprobacionController::class, 'index']);
    Route::get('/admin/historial', [AprobacionController::class, 'getHistorial']);
    Route::post('/admin/aprobaciones/{id}/aprobar', [AprobacionController::class, 'aprobar']);
    Route::post('/admin/aprobaciones/{id}/rechazar', [AprobacionController::class, 'rechazar']);

});
