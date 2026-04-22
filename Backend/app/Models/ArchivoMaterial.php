<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Archivos adjuntos a un material de apoyo */
class ArchivoMaterial extends Model
{
    protected $table = 'archivos_material';

    protected $fillable = [
        'material_id',
        'nombre_archivo',
        'ruta_archivo',
        'tipo_archivo',
        'tamano_archivo',
    ];

    public function material(): BelongsTo
    {
        return $this->belongsTo(MaterialApoyo::class, 'material_id');
    }
}
