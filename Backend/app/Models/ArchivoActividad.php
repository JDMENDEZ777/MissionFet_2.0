<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Archivos del enunciado de una actividad (subidos por el tutor) */
class ArchivoActividad extends Model
{
    protected $table = 'archivos_actividad';

    protected $fillable = [
        'actividad_id',
        'nombre_archivo',
        'ruta_archivo',
        'tipo_archivo',
        'tamano_archivo',
    ];

    public function actividad(): BelongsTo
    {
        return $this->belongsTo(Actividad::class);
    }
}
