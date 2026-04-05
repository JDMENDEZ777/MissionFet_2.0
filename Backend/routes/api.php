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
    // ... tus otras rutas ...
    Route::get('/admin/dashboard', [App\Http\Controllers\Admin\DashboardController::class, 'index']);
    Route::get('/admin/aprobaciones', [AprobacionController::class, 'index']);
    Route::post('/admin/aprobaciones/{id}/aprobar', [AprobacionController::class, 'aprobar']);
    Route::post('/admin/aprobaciones/{id}/rechazar', [AprobacionController::class, 'rechazar']);
    Route::get('/admin/usuarios', [App\Http\Controllers\Admin\UsuarioController::class, 'index']);
    Route::put('/admin/usuarios/{id}', [App\Http\Controllers\Admin\UsuarioController::class, 'update']);
    Route::delete('/admin/usuarios/{id}', [App\Http\Controllers\Admin\UsuarioController::class, 'destroy']);
});
