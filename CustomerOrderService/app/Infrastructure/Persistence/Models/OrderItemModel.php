<?php

namespace App\Infrastructure\Persistence\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemModel extends Model
{
    protected $table      = 'OrderItems';
    protected $primaryKey = 'Id';
    public    $timestamps = false;

    protected $fillable = [
        'OrderId',
        'Description',
        'Quantity',
        'UnitPrice',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(OrderModel::class, 'OrderId', 'Id');
    }
}
