<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo: EntregaActividad
 * Registra la entrega del estudiante para una actividad.
 */
class EntregaActividad extends Model
{
    protected $fillable = [
        'actividad_id',
        'estudiante_id',
        'comentario',
        'comentario_tutor',
        'calificacion',
        'estado',
        'fecha_calificacion',
    ];

    protected $casts = [
        'calificacion'       => 'decimal:2',
        'fecha_calificacion' => 'datetime',
    ];

    /** La actividad a la que corresponde esta entrega */
    public function actividad(): BelongsTo
    {
        return $this->belongsTo(Actividad::class);
    }

    /** El estudiante que realizó la entrega */
    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }

    /** Archivos adjuntos de la entrega */
    public function archivos(): HasMany
    {
        return $this->hasMany(ArchivoEntrega::class, 'entrega_id');
    }
}
