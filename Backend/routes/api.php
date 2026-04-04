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
