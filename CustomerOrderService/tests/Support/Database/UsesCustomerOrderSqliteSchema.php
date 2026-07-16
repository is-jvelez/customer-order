<?php

namespace Tests\Support\Database;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

trait UsesCustomerOrderSqliteSchema
{
    protected function useCustomerOrderSqliteSchema(): void
    {
        $databasePath = database_path('test_customer_order.sqlite');
        if (!file_exists($databasePath)) {
            touch($databasePath);
        }

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => $databasePath,
            'database.connections.sqlite.foreign_key_constraints' => true,
        ]);

        DB::purge('sqlite');
        DB::reconnect('sqlite');
        DB::setDefaultConnection('sqlite');

        $this->rebuildCustomerOrderSchema();
    }

    protected function rebuildCustomerOrderSchema(): void
    {
        Schema::dropIfExists('OrderItems');
        Schema::dropIfExists('Orders');
        Schema::dropIfExists('Customers');

        Schema::create('Customers', function (Blueprint $table): void {
            $table->increments('Id');
            $table->string('Name', 150);
            $table->string('Email', 150)->unique();
            $table->string('Phone', 20)->nullable();
            $table->string('Address', 300)->nullable();
            $table->boolean('IsActive')->default(true);
            $table->dateTime('CreatedAt')->nullable();
        });

        Schema::create('Orders', function (Blueprint $table): void {
            $table->increments('Id');
            $table->unsignedInteger('CustomerId');
            $table->string('Status', 30);
            $table->decimal('Total', 12, 2)->default(0);
            $table->string('Notes', 500)->nullable();
            $table->dateTime('CreatedAt')->nullable();
            $table->dateTime('UpdatedAt')->nullable();
            $table->unsignedTinyInteger('Priority')->default(2);
        });

        Schema::create('OrderItems', function (Blueprint $table): void {
            $table->increments('Id');
            $table->unsignedInteger('OrderId');
            $table->string('Description', 300);
            $table->integer('Quantity');
            $table->decimal('UnitPrice', 12, 2);
        });
    }
}

