<?php

namespace App\Domain\Orders\ValueObjects;

enum OrderStatus: string
{
    case Pending    = 'Pending';
    case InProgress = 'InProgress';
    case Completed  = 'Completed';
    case Cancelled  = 'Cancelled';

    public function canTransitionTo(self $target): bool
    {
        return match ($this) {
            self::Pending    => in_array($target, [self::InProgress, self::Completed, self::Cancelled]),
            self::InProgress => in_array($target, [self::Completed, self::Cancelled]),
            default          => false,
        };
    }
}
