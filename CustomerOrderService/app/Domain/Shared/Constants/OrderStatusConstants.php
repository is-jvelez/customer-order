<?php

namespace App\Domain\Shared\Constants;

class OrderStatusConstants
{
    public const PENDING     = 'Pending';
    public const IN_PROGRESS = 'InProgress';
    public const COMPLETED   = 'Completed';
    public const CANCELLED   = 'Cancelled';

    public const ALL = [
        self::PENDING,
        self::IN_PROGRESS,
        self::COMPLETED,
        self::CANCELLED,
    ];
}
