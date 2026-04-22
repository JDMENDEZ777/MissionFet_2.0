<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo: MaterialApoyo
 * Recursos de apoyo que el tutor sube para los estudiantes del seminario.
 */
class MaterialApoyo extends Model
{
    protected $table = 'materiales_apoyo';

    protected $fillable = [
        'seminario_id',
        'creado_por',
        'titulo',
        'descripcion',
        'tipo',
    ];

    public function seminario(): BelongsTo
    {
        return $this->belongsTo(Seminario::class);
    }

    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    /** Archivos descargables asociados a este material */
    public function archivos(): HasMany
    {
        return $this->hasMany(ArchivoMaterial::class, 'material_id');
    }
}
