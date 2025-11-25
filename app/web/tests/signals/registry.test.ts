import { describe, it, expect } from 'vitest';
import {
  SIGNAL_REGISTRY,
  getSignalDefinition,
  listSignalDefinitions,
  getSignalsByCategory,
  getSignalLabel,
  type SignalCategory,
} from '../../modules/signals/registry';

describe('signals/registry', () => {
  describe('SIGNAL_REGISTRY', () => {
    it('should contain volume_burst_1m entry', () => {
      expect(SIGNAL_REGISTRY.volume_burst_1m).toBeDefined();
      expect(SIGNAL_REGISTRY.volume_burst_1m.key).toBe('volume_burst_1m');
      expect(SIGNAL_REGISTRY.volume_burst_1m.label).toBe('1m Volume Burst');
      expect(SIGNAL_REGISTRY.volume_burst_1m.category).toBe('liquidity');
    });

    it('should contain volume_burst_5m entry', () => {
      expect(SIGNAL_REGISTRY.volume_burst_5m).toBeDefined();
      expect(SIGNAL_REGISTRY.volume_burst_5m.key).toBe('volume_burst_5m');
      expect(SIGNAL_REGISTRY.volume_burst_5m.label).toBe('5m Volume Burst');
      expect(SIGNAL_REGISTRY.volume_burst_5m.category).toBe('liquidity');
    });

    it('should contain price_spike entry', () => {
      expect(SIGNAL_REGISTRY.price_spike).toBeDefined();
      expect(SIGNAL_REGISTRY.price_spike.key).toBe('price_spike');
      expect(SIGNAL_REGISTRY.price_spike.label).toBe('Price Spike');
      expect(SIGNAL_REGISTRY.price_spike.category).toBe('momentum');
    });

    it('should have valid defaultSeverity values (0-3)', () => {
      for (const entry of Object.values(SIGNAL_REGISTRY)) {
        expect(entry.defaultSeverity).toBeGreaterThanOrEqual(0);
        expect(entry.defaultSeverity).toBeLessThanOrEqual(3);
      }
    });

    it('should have valid category values', () => {
      const validCategories: SignalCategory[] = [
        'momentum',
        'liquidity',
        'volatility',
        'structure',
        'other',
      ];

      for (const entry of Object.values(SIGNAL_REGISTRY)) {
        expect(validCategories).toContain(entry.category);
      }
    });
  });

  describe('getSignalDefinition', () => {
    it('should return the definition for a known key', () => {
      const def = getSignalDefinition('volume_burst_1m');

      expect(def).not.toBeNull();
      expect(def?.key).toBe('volume_burst_1m');
      expect(def?.label).toBe('1m Volume Burst');
      expect(def?.category).toBe('liquidity');
      expect(def?.defaultSeverity).toBe(2);
    });

    it('should return null for unknown key', () => {
      const def = getSignalDefinition('unknown_signal');
      expect(def).toBeNull();
    });

    it('should return null for empty string', () => {
      const def = getSignalDefinition('');
      expect(def).toBeNull();
    });

    it('should return definition with description when present', () => {
      const def = getSignalDefinition('volume_burst_1m');

      expect(def?.description).toBeDefined();
      expect(def?.description).toContain('1 minute');
    });
  });

  describe('listSignalDefinitions', () => {
    it('should return an array of all signal definitions', () => {
      const definitions = listSignalDefinitions();

      expect(Array.isArray(definitions)).toBe(true);
      expect(definitions.length).toBeGreaterThan(0);
    });

    it('should include known signals', () => {
      const definitions = listSignalDefinitions();
      const keys = definitions.map((d) => d.key);

      expect(keys).toContain('volume_burst_1m');
      expect(keys).toContain('volume_burst_5m');
      expect(keys).toContain('price_spike');
    });

    it('should return entries matching registry', () => {
      const definitions = listSignalDefinitions();

      expect(definitions.length).toBe(Object.keys(SIGNAL_REGISTRY).length);
    });

    it('should return entries with all required fields', () => {
      const definitions = listSignalDefinitions();

      for (const def of definitions) {
        expect(def.key).toBeDefined();
        expect(typeof def.key).toBe('string');
        expect(def.label).toBeDefined();
        expect(typeof def.label).toBe('string');
        expect(def.category).toBeDefined();
        expect(typeof def.defaultSeverity).toBe('number');
      }
    });
  });

  describe('getSignalsByCategory', () => {
    it('should return liquidity signals', () => {
      const signals = getSignalsByCategory('liquidity');

      expect(signals.length).toBeGreaterThan(0);
      expect(signals.every((s) => s.category === 'liquidity')).toBe(true);

      const keys = signals.map((s) => s.key);
      expect(keys).toContain('volume_burst_1m');
      expect(keys).toContain('volume_burst_5m');
    });

    it('should return momentum signals', () => {
      const signals = getSignalsByCategory('momentum');

      expect(signals.length).toBeGreaterThan(0);
      expect(signals.every((s) => s.category === 'momentum')).toBe(true);

      const keys = signals.map((s) => s.key);
      expect(keys).toContain('price_spike');
    });

    it('should return empty array for category with no signals', () => {
      // 'other' category might be empty
      const signals = getSignalsByCategory('other');
      expect(Array.isArray(signals)).toBe(true);
    });
  });

  describe('getSignalLabel', () => {
    it('should return the label for a known signal', () => {
      expect(getSignalLabel('volume_burst_1m')).toBe('1m Volume Burst');
      expect(getSignalLabel('price_spike')).toBe('Price Spike');
    });

    it('should return the key as fallback for unknown signal', () => {
      expect(getSignalLabel('unknown_signal')).toBe('unknown_signal');
      expect(getSignalLabel('custom_metric')).toBe('custom_metric');
    });
  });

  describe('SignalRegistryEntry structure', () => {
    it('should have consistent key and id in entries', () => {
      for (const [key, entry] of Object.entries(SIGNAL_REGISTRY)) {
        expect(entry.key).toBe(key);
      }
    });
  });
});
