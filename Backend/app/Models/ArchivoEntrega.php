<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Archivos adjuntos por el estudiante al realizar una entrega */
class ArchivoEntrega extends Model
{
    protected $fillable = [
        'entrega_id',
        'nombre_archivo',
        'ruta_archivo',
        'tipo_archivo',
        'tamano_archivo',
    ];

    public function entrega(): BelongsTo
    {
        return $this->belongsTo(EntregaActividad::class, 'entrega_id');
    }
}
