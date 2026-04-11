<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\AprobacionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// ─── Rutas públicas ───────────────────────────────────────────────────────────
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/registro', [AuthController::class, 'register']);

// ─── Rutas protegidas (requieren token Sanctum) ───────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/dashboard-stats', [DashboardController::class, 'index']);

    // ── ADMIN: Aprobaciones ───────────────────────────────────────────────────
    Route::get('/admin/dashboard',   [App\Http\Controllers\Admin\DashboardController::class, 'index']);
    Route::get('/admin/aprobaciones',             [AprobacionController::class, 'index']);
    Route::post('/admin/aprobaciones/{id}/aprobar', [AprobacionController::class, 'aprobar']);
    Route::post('/admin/aprobaciones/{id}/rechazar', [AprobacionController::class, 'rechazar']);

    // ── ADMIN: Usuarios ───────────────────────────────────────────────────────
    Route::get('/admin/usuarios',      [App\Http\Controllers\Admin\UsuarioController::class, 'index']);
    Route::put('/admin/usuarios/{id}', [App\Http\Controllers\Admin\UsuarioController::class, 'update']);
    Route::delete('/admin/usuarios/{id}', [App\Http\Controllers\Admin\UsuarioController::class, 'destroy']);

    // ── ADMIN: Seminarios (gestión completa) ──────────────────────────────────
    Route::get('/admin/tutores',    [App\Http\Controllers\Admin\SeminarioController::class, 'getTutores']);
    Route::get('/admin/seminarios', [App\Http\Controllers\Admin\SeminarioController::class, 'index']);
    Route::post('/admin/seminarios', [App\Http\Controllers\Admin\SeminarioController::class, 'store']);
    Route::get('/admin/seminarios/{id}',    [App\Http\Controllers\Admin\SeminarioController::class, 'show']);
    Route::put('/admin/seminarios/{id}',    [App\Http\Controllers\Admin\SeminarioController::class, 'update']);
    Route::delete('/admin/seminarios/{id}', [App\Http\Controllers\Admin\SeminarioController::class, 'destroy']);
    Route::get('/admin/seminarios/{id}/disponibles',          [App\Http\Controllers\Admin\SeminarioController::class, 'getEstudiantesDisponibles']);
    Route::post('/admin/seminarios/{id}/inscribir',           [App\Http\Controllers\Admin\SeminarioController::class, 'inscribir']);
    Route::delete('/admin/seminarios/{id}/inscripcion/{estudiante_id}', [App\Http\Controllers\Admin\SeminarioController::class, 'eliminarInscripcion']);

    // ── ADMIN: Proyectos ──────────────────────────────────────────────────────
    Route::get('/admin/proyectos/form-data', [App\Http\Controllers\Admin\ProyectoController::class, 'getFormData']);
    Route::get('/admin/proyectos',           [App\Http\Controllers\Admin\ProyectoController::class, 'index']);
    Route::post('/admin/proyectos',          [App\Http\Controllers\Admin\ProyectoController::class, 'store']);

    // ─────────────────────────────────────────────────────────────────────────
    // ── TUTOR: Dashboard del seminario ────────────────────────────────────────
    // ─────────────────────────────────────────────────────────────────────────
    Route::prefix('tutor/seminarios/{seminario_id}')->group(function () {

        // Panel de control inicial del tutor
        Route::get('/dashboard', [App\Http\Controllers\Tutor\SeminarioDashboardController::class, 'dashboard']);

        // Actividades (CRUD completo)
        Route::get('/actividades',          [App\Http\Controllers\Tutor\ActividadController::class, 'index']);
        Route::post('/actividades',         [App\Http\Controllers\Tutor\ActividadController::class, 'store']);
        Route::get('/actividades/{act_id}', [App\Http\Controllers\Tutor\ActividadController::class, 'show']);
        Route::put('/actividades/{act_id}', [App\Http\Controllers\Tutor\ActividadController::class, 'update']);
        Route::delete('/actividades/{act_id}', [App\Http\Controllers\Tutor\ActividadController::class, 'destroy']);

        // Entregas de los estudiantes + calificación
        Route::get('/actividades/{act_id}/entregas',                  [App\Http\Controllers\Tutor\EntregaController::class, 'index']);
        Route::post('/actividades/{act_id}/entregas/{entrega_id}/calificar', [App\Http\Controllers\Tutor\EntregaController::class, 'calificar']);

        // Clases virtuales (CRUD)
        Route::get('/clases',          [App\Http\Controllers\Tutor\ClaseVirtualController::class, 'index']);
        Route::post('/clases',         [App\Http\Controllers\Tutor\ClaseVirtualController::class, 'store']);
        Route::put('/clases/{cls_id}', [App\Http\Controllers\Tutor\ClaseVirtualController::class, 'update']);
        Route::delete('/clases/{cls_id}', [App\Http\Controllers\Tutor\ClaseVirtualController::class, 'destroy']);

        // Materiales de apoyo (CRUD)
        Route::get('/materiales',          [App\Http\Controllers\Tutor\MaterialApoyoController::class, 'index']);
        Route::post('/materiales',         [App\Http\Controllers\Tutor\MaterialApoyoController::class, 'store']);
        Route::delete('/materiales/{mat_id}', [App\Http\Controllers\Tutor\MaterialApoyoController::class, 'destroy']);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // ── ESTUDIANTE: Dashboard del seminario ───────────────────────────────────
    // ─────────────────────────────────────────────────────────────────────────
    Route::prefix('estudiante/seminarios/{seminario_id}')->group(function () {

        // Información del seminario + estadísticas del estudiante
        Route::get('/dashboard',  [App\Http\Controllers\Estudiante\SeminarioDashboardController::class, 'dashboard']);
        Route::get('/info',       [App\Http\Controllers\Estudiante\SeminarioDashboardController::class, 'mySeminario']);

        // Ver actividades y entregar tareas
        Route::get('/actividades',            [App\Http\Controllers\Estudiante\ActividadController::class, 'index']);
        Route::post('/actividades/{act_id}/entregar', [App\Http\Controllers\Estudiante\ActividadController::class, 'store']);

        // Clases virtuales (solo lectura)
        Route::get('/clases',     [App\Http\Controllers\Estudiante\SeminarioDashboardController::class, 'clases']);

        // Materiales de apoyo (solo lectura)
        Route::get('/materiales', [App\Http\Controllers\Estudiante\SeminarioDashboardController::class, 'materiales']);
    });

});
