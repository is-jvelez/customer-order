<?php

namespace Tests\Feature\Golden;

use Illuminate\Support\Facades\DB;
use Tests\Support\AuthenticatesWithJwt;
use Tests\Support\Database\UsesCustomerOrderSqliteSchema;
use Tests\TestCase;

/**
 * Golden master (characterization) test for CR-001-order-priority.
 *
 * Captures the JSON contract of GET /orders and GET /orders/{id} for a fixed,
 * deterministic fixture. Before the CR, the response must match tests/golden/*.json
 * byte-for-field exactly. After the CR, every field of the golden master must still
 * be present with the exact same value; the only allowed addition is the new
 * `priority` field (int 1-3).
 *
 * getStats()/getOrdersByDay()/getOrdersByMonth() are intentionally out of scope here
 * (untouched by this CR) and are already covered by
 * EloquentOrderRepositoryIntegrationTest::test_GetStatsAndOrdersByDay_...(), which
 * keeps passing unmodified.
 */
class OrderGoldenMasterTest extends TestCase
{
    use AuthenticatesWithJwt;
    use UsesCustomerOrderSqliteSchema;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCustomerOrderSqliteSchema();
        $this->seedFixture();
    }

    public function test_IndexResponse_ShouldMatchGoldenMasterPlusPriority_WhenOrdersAreListed(): void
    {
        $this->authenticateWithJwt();

        $response = $this->getJson('/api/orders?per_page=15&page=1', $this->apiHeaders());
        $response->assertStatus(200);

        $golden = $this->loadGolden('orders_index.json');
        $actual = $response->json();

        $goldenOrder = $golden['data']['items'][0];
        $actualOrder = $actual['data']['items'][0];

        $this->assertSame($golden['success'], $actual['success']);
        $this->assertSame($golden['message'], $actual['message']);
        $this->assertSame($golden['data']['pagination'], $actual['data']['pagination']);
        $this->assertCount(count($golden['data']['items']), $actual['data']['items']);
        $this->assertOrderMatchesGoldenPlusPriority($goldenOrder, $actualOrder);
    }

    public function test_ShowResponse_ShouldMatchGoldenMasterPlusPriority_WhenOrderIsFetchedById(): void
    {
        $this->authenticateWithJwt();

        $response = $this->getJson('/api/orders/1', $this->apiHeaders());
        $response->assertStatus(200);

        $golden = $this->loadGolden('orders_show.json');
        $actual = $response->json();

        $this->assertSame($golden['success'], $actual['success']);
        $this->assertSame($golden['message'], $actual['message']);
        $this->assertOrderMatchesGoldenPlusPriority($golden['data'], $actual['data']);
    }

    /**
     * Every field present in the golden master must still be present, in the same
     * value. The only extra field tolerated on the "after" side is `priority`.
     */
    private function assertOrderMatchesGoldenPlusPriority(array $goldenOrder, array $actualOrder): void
    {
        foreach ($goldenOrder as $key => $value) {
            $this->assertArrayHasKey($key, $actualOrder, "Golden master field '{$key}' is missing from the response.");

            if ($key === 'items') {
                $this->assertCount(count($value), $actualOrder['items']);
                foreach ($value as $i => $goldenItem) {
                    $this->assertSame($goldenItem, $actualOrder['items'][$i], "Order item #{$i} changed from golden master.");
                }
                continue;
            }

            $this->assertSame($value, $actualOrder[$key], "Field '{$key}' changed from golden master.");
        }

        $extraKeys = array_diff(array_keys($actualOrder), array_keys($goldenOrder));
        $this->assertSame(
            ['priority'],
            array_values($extraKeys),
            'Only the new `priority` field is allowed in addition to the golden master fields.',
        );
        $this->assertContains($actualOrder['priority'], [1, 2, 3], 'priority must be an integer in {1,2,3}.');
    }

    private function loadGolden(string $filename): array
    {
        $path = __DIR__ . '/../../golden/' . $filename;

        return json_decode(file_get_contents($path), true);
    }

    private function seedFixture(): void
    {
        DB::table('Customers')->insert([
            'Id'        => 1,
            'Name'      => 'Golden Customer',
            'Email'     => 'golden@example.com',
            'Phone'     => '5551234',
            'Address'   => 'Golden Street 1',
            'IsActive'  => 1,
            'CreatedAt' => '2026-01-01 09:00:00',
        ]);

        DB::table('Orders')->insert([
            'Id'         => 1,
            'CustomerId' => 1,
            'Status'     => 'Pending',
            'Total'      => 130.50,
            'Notes'      => 'Golden order',
            'CreatedAt'  => '2026-01-05 10:00:00',
            'UpdatedAt'  => '2026-01-05 10:05:00',
        ]);

        DB::table('OrderItems')->insert([
            ['Id' => 1, 'OrderId' => 1, 'Description' => 'Item A', 'Quantity' => 2, 'UnitPrice' => 15.25],
            ['Id' => 2, 'OrderId' => 1, 'Description' => 'Item B', 'Quantity' => 1, 'UnitPrice' => 100.00],
        ]);
    }
}
