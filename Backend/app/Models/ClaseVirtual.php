<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo: ClaseVirtual
 * Representa una sesión de clase virtual programada por el tutor.
 */
class ClaseVirtual extends Model
{
    protected $table = 'clases_virtuales';

    protected $fillable = [
        'seminario_id',
        'tutor_id',
        'titulo',
        'descripcion',
        'fecha',
        'hora',
        'duracion',
        'plataforma',
        'enlace',
        'url_grabacion',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function seminario(): BelongsTo
    {
        return $this->belongsTo(Seminario::class);
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }
}
