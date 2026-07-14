<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerModel extends Model
{
    protected $table      = 'Customers';
    protected $primaryKey = 'Id';
    public    $timestamps = false;

    protected $fillable = [
        'Name',
        'Email',
        'Phone',
        'Address',
        'IsActive',
    ];

    protected $casts = [
        'IsActive' => 'boolean',
    ];
}
