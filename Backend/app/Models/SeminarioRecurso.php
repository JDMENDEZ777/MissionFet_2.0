<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeminarioRecurso extends Model
{
    protected $table = 'seminario_recursos';

    protected $fillable = [
        'seminario_id',
        'titulo',
        'descripcion',
        'tipo',
        'archivo',
        'url',
    ];

    public function seminario()
    {
        return $this->belongsTo(Seminario::class, 'seminario_id');
    }
}
