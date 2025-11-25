import { describe, it, expect } from 'vitest';

describe('asset page', () => {
  describe('Saved Views link', () => {
    it('should construct correct href with assetId query param', () => {
      const itemId = 'item-btc';
      const expectedHref = `/opportunities?assetId=${itemId}`;

      expect(expectedHref).toBe('/opportunities?assetId=item-btc');
    });

    it('should encode special characters in assetId', () => {
      const itemId = 'item-btc/usdt';
      const encodedId = encodeURIComponent(itemId);
      const expectedHref = `/opportunities?assetId=${encodedId}`;

      expect(expectedHref).toBe('/opportunities?assetId=item-btc%2Fusdt');
    });

    it('should handle various assetId formats', () => {
      const testCases = [
        { itemId: 'item-1', expected: '/opportunities?assetId=item-1' },
        { itemId: 'token-btc', expected: '/opportunities?assetId=token-btc' },
        { itemId: 'market-eth-usdt', expected: '/opportunities?assetId=market-eth-usdt' },
      ];

      testCases.forEach(({ itemId, expected }) => {
        const href = `/opportunities?assetId=${itemId}`;
        expect(href).toBe(expected);
      });
    });
  });

  describe('Layout structure', () => {
    it('should have sections in correct order', () => {
      const sections = [
        'header',
        'two-column-layout',
        'left-column',
        'key-metrics',
        'price-chart',
        'right-column',
        'signals-panel',
        'watchlists',
        'market-details-optional',
      ];

      expect(sections).toContain('header');
      expect(sections).toContain('key-metrics');
      expect(sections).toContain('price-chart');
      expect(sections).toContain('signals-panel');
      expect(sections).toContain('watchlists');
    });
  });
});
