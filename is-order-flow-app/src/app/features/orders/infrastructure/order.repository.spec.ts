import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderRepository } from './order.repository';
import { ORDER_ROUTES } from '../../../shared/constants/api-routes.constants';
import { OrderPriority } from '../../../shared/constants/app.constants';
import { ApiResponse } from '../../../core/models/api-response.model';

describe('OrderRepository — priority contract', () => {
  let repo: OrderRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    repo = TestBed.inject(OrderRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends `priority` as a query param on getAll() when provided', () => {
    repo.getAll({ priority: OrderPriority.High }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === ORDER_ROUTES.BASE && r.params.get('priority') === '3',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { items: [], pagination: { total: 0, per_page: 15, current_page: 1, last_page: 1 } }, message: '', errors: [] });
  });

  it('does not send `priority` query param when omitted (previous behavior intact)', () => {
    repo.getAll({}).subscribe();

    const req = httpMock.expectOne(ORDER_ROUTES.BASE);
    expect(req.request.params.has('priority')).toBe(false);
    req.flush({ success: true, data: { items: [], pagination: { total: 0, per_page: 15, current_page: 1, last_page: 1 } }, message: '', errors: [] });
  });

  it('maps `priority` from the raw JSON response onto the Order model', () => {
    let result: ApiResponse<{ data: any[] }> | undefined;
    repo.getAll({}).subscribe((res) => (result = res as any));

    const req = httpMock.expectOne(ORDER_ROUTES.BASE);
    req.flush({
      success: true,
      data: {
        items: [
          {
            id: 1,
            customer_id: 1,
            status: 'Pending',
            priority: 3,
            total: 100,
            notes: null,
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
            items: [],
          },
        ],
        pagination: { total: 1, per_page: 15, current_page: 1, last_page: 1 },
      },
      message: '',
      errors: [],
    });

    expect((result as any).data.data[0].priority).toBe(3);
  });

  it('sends `priority` in the create() request body', () => {
    repo
      .create({ customerId: 1, notes: null, priority: OrderPriority.High, items: [] })
      .subscribe();

    const req = httpMock.expectOne(ORDER_ROUTES.BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.priority).toBe(OrderPriority.High);
    req.flush({
      success: true,
      data: {
        id: 1,
        customer_id: 1,
        status: 'Pending',
        priority: 3,
        total: 0,
        notes: null,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        items: [],
      },
      message: '',
      errors: [],
    });
  });
});
