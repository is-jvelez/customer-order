<?php

namespace App\Enums;

enum OrderPriority: int
{
    case Low    = 1;
    case Medium = 2;
    case High   = 3;
}
