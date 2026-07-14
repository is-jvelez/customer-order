<?php

namespace Tests\Unit\Http\Requests;

use App\Http\Requests\Customer\CreateCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Requests\Order\CreateOrderRequest;
use App\Http\Requests\Order\UpdateOrderRequest;
use PHPUnit\Framework\TestCase;

class RequestRulesTest extends TestCase
{
    public function test_CreateCustomerRequest_ShouldDefineExpectedRulesAndMessages_WhenCalled(): void
    {
        $request = new CreateCustomerRequest();

        $this->assertTrue($request->authorize());
        $this->assertArrayHasKey('name', $request->rules());
        $this->assertArrayHasKey('email', $request->rules());
        $this->assertArrayHasKey('name.required', $request->messages());
    }

    public function test_UpdateCustomerRequest_ShouldDefineOptionalRules_WhenCalled(): void
    {
        $request = new UpdateCustomerRequest();
        $rules = $request->rules();

        $this->assertTrue($request->authorize());
        $this->assertContains('sometimes', $rules['name']);
        $this->assertContains('required', $rules['name']);
        $this->assertContains('email', $rules['email']);
    }

    public function test_CreateOrderRequest_ShouldDefineNestedItemRulesAndMessages_WhenCalled(): void
    {
        $request = new CreateOrderRequest();
        $rules = $request->rules();
        $messages = $request->messages();

        $this->assertTrue($request->authorize());
        $this->assertArrayHasKey('items.*.description', $rules);
        $this->assertArrayHasKey('items.*.quantity', $rules);
        $this->assertArrayHasKey('items.*.unit_price', $rules);
        $this->assertArrayHasKey('items.required', $messages);
    }

    public function test_UpdateOrderRequest_ShouldAllowOnlyNotes_WhenCalled(): void
    {
        $request = new UpdateOrderRequest();
        $rules = $request->rules();

        $this->assertTrue($request->authorize());
        $this->assertCount(1, $rules);
        $this->assertArrayHasKey('notes', $rules);
    }
}

