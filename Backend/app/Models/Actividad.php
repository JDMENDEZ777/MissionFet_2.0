<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo: Actividad
 * Representa una tarea asignada por el tutor dentro de un seminario.
 */
class Actividad extends Model
{
    protected $fillable = [
        'seminario_id',
        'tutor_id',
        'titulo',
        'descripcion',
        'fecha_limite',
        'hora_limite',
        'tipo',
        'puntaje',
        'permitir_entregas_tarde',
    ];

    protected $casts = [
        'fecha_limite'            => 'date',
        'puntaje'                 => 'decimal:2',
        'permitir_entregas_tarde' => 'boolean',
    ];

    /** El seminario al que pertenece esta actividad */
    public function seminario(): BelongsTo
    {
        return $this->belongsTo(Seminario::class);
    }

    /** El tutor que creó la actividad */
    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    /** Archivos adjuntos del enunciado de la actividad */
    public function archivos(): HasMany
    {
        return $this->hasMany(ArchivoActividad::class);
    }

    /** Todas las entregas de los estudiantes para esta actividad */
    public function entregas(): HasMany
    {
        return $this->hasMany(EntregaActividad::class);
    }
}
