<?php

namespace App\Infrastructure\Persistence\Models;

use App\Enums\OrderPriority;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderModel extends Model
{
    protected $table      = 'Orders';
    protected $primaryKey = 'Id';
    public    $timestamps = false;

    // Total y UpdatedAt son gestionados por triggers de SQL Server
    protected $fillable = [
        'CustomerId',
        'Status',
        'Notes',
        'Priority',
    ];

    protected $casts = [
        'Priority' => OrderPriority::class,
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItemModel::class, 'OrderId', 'Id');
    }
}
