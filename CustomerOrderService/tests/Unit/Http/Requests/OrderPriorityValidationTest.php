<?php

namespace Tests\Unit\Http\Requests;

use App\Http\Requests\Order\CreateOrderRequest;
use App\Http\Requests\Order\UpdateOrderRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class OrderPriorityValidationTest extends TestCase
{
    /** @dataProvider validPriorityProvider */
    public function test_CreateOrderRequest_ShouldAcceptValidPriority_WhenValueIsAllowed(int $priority): void
    {
        $rules = (new CreateOrderRequest())->rules();

        $validator = Validator::make(['priority' => $priority], ['priority' => $rules['priority']]);

        $this->assertFalse($validator->fails());
    }

    /** @dataProvider invalidPriorityProvider */
    public function test_CreateOrderRequest_ShouldRejectInvalidPriority_WhenValueIsOutOfRangeOrNotNumeric($priority): void
    {
        $rules = (new CreateOrderRequest())->rules();

        $validator = Validator::make(['priority' => $priority], ['priority' => $rules['priority']]);

        $this->assertTrue($validator->fails());
    }

    public function test_CreateOrderRequest_ShouldAcceptMissingPriority_WhenFieldIsOmitted(): void
    {
        $rules = (new CreateOrderRequest())->rules();

        $validator = Validator::make([], ['priority' => $rules['priority']]);

        $this->assertFalse($validator->fails());
    }

    /** @dataProvider invalidPriorityProvider */
    public function test_UpdateOrderRequest_ShouldRejectInvalidPriority_WhenValueIsOutOfRangeOrNotNumeric($priority): void
    {
        $rules = (new UpdateOrderRequest())->rules();

        $validator = Validator::make(['priority' => $priority], ['priority' => $rules['priority']]);

        $this->assertTrue($validator->fails());
    }

    public static function validPriorityProvider(): array
    {
        return [
            'Low' => [1],
            'Medium' => [2],
            'High' => [3],
        ];
    }

    public static function invalidPriorityProvider(): array
    {
        return [
            'zero' => [0],
            'four' => [4],
            'nine' => [9],
            'non-numeric' => ['x'],
        ];
    }
}
