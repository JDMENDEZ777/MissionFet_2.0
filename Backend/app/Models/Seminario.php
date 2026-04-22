<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo: Seminario
 * Entidad principal del módulo. Actúa como contenedor de todo:
 * actividades, clases virtuales, materiales e inscripciones.
 */
class Seminario extends Model
{
    protected $table = 'seminarios';

    protected $fillable = [
        'titulo',
        'descripcion',
        'fecha',
        'hora',
        'modalidad',
        'lugar',
        'cupos',
        'tutor_id',
        'archivo_guia',
        'estado',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    /** El tutor responsable del seminario */
    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    /** Estudiantes inscritos en el seminario */
    public function inscripciones(): HasMany
    {
        return $this->hasMany(InscripcionSeminario::class);
    }

    /** Actividades/tareas creadas en este seminario */
    public function actividades(): HasMany
    {
        return $this->hasMany(Actividad::class);
    }

    /** Clases virtuales programadas para este seminario */
    public function clases(): HasMany
    {
        return $this->hasMany(ClaseVirtual::class);
    }

    /** Materiales de apoyo disponibles para los estudiantes */
    public function materiales(): HasMany
    {
        return $this->hasMany(MaterialApoyo::class);
    }
}

