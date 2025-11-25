import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the modules before importing the route
vi.mock('../../modules/markets/marketData', () => ({
  getMarketDataProvider: vi.fn(),
}));

vi.mock('../../modules/watchlists/service', () => ({
  listWatchlists: vi.fn(),
}));

import { GET } from '../../app/api/health/route';
import { getMarketDataProvider } from '../../modules/markets/marketData';
import { listWatchlists } from '../../modules/watchlists/service';

const mockGetMarketDataProvider = vi.mocked(getMarketDataProvider);
const mockListWatchlists = vi.mocked(listWatchlists);

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return ok status when both components are healthy', async () => {
    // Setup: market data provider works
    mockGetMarketDataProvider.mockReturnValue({
      getSnapshot: vi.fn().mockResolvedValue({ price: 100 }),
      getSnapshots: vi.fn().mockResolvedValue(new Map()),
    });

    // Setup: db works
    mockListWatchlists.mockReturnValue([]);

    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('ok');
    expect(data.components.marketDataProvider).toBe('ok');
    expect(data.components.db).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  it('should return degraded status when market data provider throws', async () => {
    // Setup: market data provider throws
    mockGetMarketDataProvider.mockReturnValue({
      getSnapshot: vi.fn().mockRejectedValue(new Error('Provider error')),
      getSnapshots: vi.fn().mockResolvedValue(new Map()),
    });

    // Setup: db works
    mockListWatchlists.mockReturnValue([]);

    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('degraded');
    expect(data.components.marketDataProvider).toBe('error');
    expect(data.components.db).toBe('ok');
  });

  it('should return degraded status when db throws', async () => {
    // Setup: market data provider works
    mockGetMarketDataProvider.mockReturnValue({
      getSnapshot: vi.fn().mockResolvedValue({ price: 100 }),
      getSnapshots: vi.fn().mockResolvedValue(new Map()),
    });

    // Setup: db throws
    mockListWatchlists.mockImplementation(() => {
      throw new Error('Database error');
    });

    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('degraded');
    expect(data.components.marketDataProvider).toBe('ok');
    expect(data.components.db).toBe('error');
  });

  it('should return ok status when market data provider is not configured but db is ok', async () => {
    // Setup: market data provider returns null (not configured)
    mockGetMarketDataProvider.mockReturnValue(null as never);

    // Setup: db works
    mockListWatchlists.mockReturnValue([]);

    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('ok');
    expect(data.components.marketDataProvider).toBe('not_configured');
    expect(data.components.db).toBe('ok');
  });

  it('should return degraded status when both components fail', async () => {
    // Setup: market data provider throws
    mockGetMarketDataProvider.mockReturnValue({
      getSnapshot: vi.fn().mockRejectedValue(new Error('Provider error')),
      getSnapshots: vi.fn().mockResolvedValue(new Map()),
    });

    // Setup: db throws
    mockListWatchlists.mockImplementation(() => {
      throw new Error('Database error');
    });

    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('degraded');
    expect(data.components.marketDataProvider).toBe('error');
    expect(data.components.db).toBe('error');
  });

  it('should include timestamp in response', async () => {
    mockGetMarketDataProvider.mockReturnValue({
      getSnapshot: vi.fn().mockResolvedValue({ price: 100 }),
      getSnapshots: vi.fn().mockResolvedValue(new Map()),
    });
    mockListWatchlists.mockReturnValue([]);

    const before = new Date().toISOString();
    const response = await GET();
    const data = await response.json();
    const after = new Date().toISOString();

    expect(data.timestamp).toBeDefined();
    expect(data.timestamp >= before).toBe(true);
    expect(data.timestamp <= after).toBe(true);
  });

  it('should return JSON response', async () => {
    mockGetMarketDataProvider.mockReturnValue({
      getSnapshot: vi.fn().mockResolvedValue({ price: 100 }),
      getSnapshots: vi.fn().mockResolvedValue(new Map()),
    });
    mockListWatchlists.mockReturnValue([]);

    const response = await GET();

    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
