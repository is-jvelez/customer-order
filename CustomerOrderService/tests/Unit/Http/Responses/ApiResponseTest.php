<?php

namespace Tests\Unit\Http\Responses;

use App\Http\Responses\ApiResponse;
use Tests\TestCase;

class ApiResponseTest extends TestCase
{
    public function test_Success_ShouldReturnStandardPayload_WhenCalled(): void
    {
        $response = ApiResponse::success(['id' => 1], 'ok', 201);
        $json = $response->getData(true);

        $this->assertSame(201, $response->status());
        $this->assertTrue($json['success']);
        $this->assertSame(['id' => 1], $json['data']);
        $this->assertSame('ok', $json['message']);
        $this->assertSame([], $json['errors']);
    }

    public function test_Error_ShouldReturnStandardPayload_WhenCalled(): void
    {
        $response = ApiResponse::error('failed', ['reason'], 422);
        $json = $response->getData(true);

        $this->assertSame(422, $response->status());
        $this->assertFalse($json['success']);
        $this->assertNull($json['data']);
        $this->assertSame(['reason'], $json['errors']);
    }
}

