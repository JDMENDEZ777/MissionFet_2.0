<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InscripcionSeminario extends Model
{
    use HasFactory;

    protected $table = 'inscripciones_seminario';

    protected $fillable = [
        'seminario_id',
        'estudiante_id',
        'estado',
        'asistencia',
        'nota',
    ];

    public function seminario()
    {
        return $this->belongsTo(Seminario::class);
    }

    public function estudiante()
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }
}
