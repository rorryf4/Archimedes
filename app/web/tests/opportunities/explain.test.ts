import { describe, it, expect } from 'vitest';
import {
  buildOpportunityExplanation,
  type OpportunityExplanation,
  type OpportunityExplanationFactor,
} from '@/modules/opportunities/explain';
import type { OpportunitySubScores } from '@/modules/opportunities/service';

describe('buildOpportunityExplanation', () => {
  describe('factor construction', () => {
    it('should create factors with correct structure', () => {
      const subScores: OpportunitySubScores = {
        severity: 100,
        signalDensity: 75,
        priceMomentum: 50,
        volume: 25,
        trend: 80,
        preferenceAlignment: 60,
      };

      const explanation = buildOpportunityExplanation(subScores);

      expect(explanation.factors).toHaveLength(6);

      // Check all factors have required properties
      explanation.factors.forEach((factor) => {
        expect(factor).toHaveProperty('key');
        expect(factor).toHaveProperty('label');
        expect(factor).toHaveProperty('score');
        expect(factor).toHaveProperty('weight');
        expect(factor).toHaveProperty('contribution');
        expect(factor).toHaveProperty('verdict');
      });
    });

    it('should use correct weights for each factor', () => {
      const subScores: OpportunitySubScores = {
        severity: 50,
        signalDensity: 50,
        priceMomentum: 50,
        volume: 50,
        trend: 50,
        preferenceAlignment: 50,
      };

      const explanation = buildOpportunityExplanation(subScores);
      const factorMap = new Map(explanation.factors.map((f) => [f.key, f]));

      expect(factorMap.get('severity')?.weight).toBe(0.3);
      expect(factorMap.get('density')?.weight).toBe(0.2);
      expect(factorMap.get('momentum')?.weight).toBe(0.15);
      expect(factorMap.get('volume')?.weight).toBe(0.15);
      expect(factorMap.get('trend')?.weight).toBe(0.1);
      expect(factorMap.get('preferences')?.weight).toBe(0.1);
    });

    it('should calculate contribution correctly', () => {
      const subScores: OpportunitySubScores = {
        severity: 100, // contribution = (100/100) * (0.3 * 100) = 30
        signalDensity: 50, // contribution = (50/100) * (0.2 * 100) = 10
        priceMomentum: 0, // contribution = (0/100) * (0.15 * 100) = 0
        volume: 50,
        trend: 50,
        preferenceAlignment: 50,
      };

      const explanation = buildOpportunityExplanation(subScores);
      const factorMap = new Map(explanation.factors.map((f) => [f.key, f]));

      expect(factorMap.get('severity')?.contribution).toBe(30);
      expect(factorMap.get('density')?.contribution).toBe(10);
      expect(factorMap.get('momentum')?.contribution).toBe(0);
    });

    it('should sort factors by contribution descending', () => {
      const subScores: OpportunitySubScores = {
        severity: 100, // 30
        signalDensity: 25, // 5
        priceMomentum: 100, // 15
        volume: 50, // 7.5
        trend: 0, // 0
        preferenceAlignment: 100, // 10
      };

      const explanation = buildOpportunityExplanation(subScores);

      // Expected order: severity (30), momentum (15), preferences (10), volume (7.5), density (5), trend (0)
      expect(explanation.factors[0].key).toBe('severity');
      expect(explanation.factors[1].key).toBe('momentum');
      expect(explanation.factors[2].key).toBe('preferences');
      expect(explanation.factors[3].key).toBe('volume');
      expect(explanation.factors[4].key).toBe('density');
      expect(explanation.factors[5].key).toBe('trend');
    });
  });

  describe('verdict mapping', () => {
    it('should assign "strong" verdict for score >= 75', () => {
      const subScores: OpportunitySubScores = {
        severity: 75,
        signalDensity: 80,
        priceMomentum: 100,
        volume: 50,
        trend: 50,
        preferenceAlignment: 50,
      };

      const explanation = buildOpportunityExplanation(subScores);
      const factorMap = new Map(explanation.factors.map((f) => [f.key, f]));

      expect(factorMap.get('severity')?.verdict).toBe('strong');
      expect(factorMap.get('density')?.verdict).toBe('strong');
      expect(factorMap.get('momentum')?.verdict).toBe('strong');
    });

    it('should assign "neutral" verdict for 40 <= score < 75', () => {
      const subScores: OpportunitySubScores = {
        severity: 40,
        signalDensity: 50,
        priceMomentum: 74,
        volume: 50,
        trend: 50,
        preferenceAlignment: 50,
      };

      const explanation = buildOpportunityExplanation(subScores);
      const factorMap = new Map(explanation.factors.map((f) => [f.key, f]));

      expect(factorMap.get('severity')?.verdict).toBe('neutral');
      expect(factorMap.get('density')?.verdict).toBe('neutral');
      expect(factorMap.get('momentum')?.verdict).toBe('neutral');
    });

    it('should assign "weak" verdict for score < 40', () => {
      const subScores: OpportunitySubScores = {
        severity: 0,
        signalDensity: 25,
        priceMomentum: 39,
        volume: 50,
        trend: 50,
        preferenceAlignment: 50,
      };

      const explanation = buildOpportunityExplanation(subScores);
      const factorMap = new Map(explanation.factors.map((f) => [f.key, f]));

      expect(factorMap.get('severity')?.verdict).toBe('weak');
      expect(factorMap.get('density')?.verdict).toBe('weak');
      expect(factorMap.get('momentum')?.verdict).toBe('weak');
    });
  });

  describe('headline generation', () => {
    it('should generate headline for strong severity + strong density', () => {
      const subScores: OpportunitySubScores = {
        severity: 100,
        signalDensity: 80,
        priceMomentum: 50,
        volume: 50,
        trend: 50,
        preferenceAlignment: 50,
      };

      const explanation = buildOpportunityExplanation(subScores);

      expect(explanation.headline).toBe(
        'High-severity signals with strong confluence create compelling opportunity.'
      );
    });

    it('should generate headline for strong severity but weak density', () => {
      const subScores: OpportunitySubScores = {
        severity: 100,
        signalDensity: 25,
        priceMomentum: 50,
        volume: 50,
        trend: 50,
        preferenceAlignment: 50,
      };

      const explanation = buildOpportunityExplanation(subScores);

      expect(explanation.headline).toBe(
        'High-severity signal present but limited confluence with other indicators.'
      );
    });

    it('should generate headline for strong momentum + strong volume', () => {
      const subScores: OpportunitySubScores = {
        severity: 50,
        signalDensity: 50,
        priceMomentum: 85,
        volume: 90,
        trend: 50,
        preferenceAlignment: 50,
      };

      const explanation = buildOpportunityExplanation(subScores);

      expect(explanation.headline).toBe(
        'Strong price momentum backed by elevated volume suggests sustained move.'
      );
    });

    it('should generate headline for strong trend but weak severity', () => {
      const subScores: OpportunitySubScores = {
        severity: 25,
        signalDensity: 50,
        priceMomentum: 50,
        volume: 50,
        trend: 85,
        preferenceAlignment: 50,
      };

      const explanation = buildOpportunityExplanation(subScores);

      expect(explanation.headline).toBe(
        'Favorable trend pattern with moderate signal strength.'
      );
    });

    it('should generate headline for strong preferences', () => {
      const subScores: OpportunitySubScores = {
        severity: 50,
        signalDensity: 50,
        priceMomentum: 50,
        volume: 50,
        trend: 50,
        preferenceAlignment: 90,
      };

      const explanation = buildOpportunityExplanation(subScores);

      expect(explanation.headline).toBe(
        'Strong alignment with your signal preferences highlights relevance.'
      );
    });

    it('should generate headline for all weak factors', () => {
      const subScores: OpportunitySubScores = {
        severity: 10,
        signalDensity: 15,
        priceMomentum: 20,
        volume: 25,
        trend: 30,
        preferenceAlignment: 35,
      };

      const explanation = buildOpportunityExplanation(subScores);

      expect(explanation.headline).toBe(
        'Weak signals and market conditions suggest low conviction opportunity.'
      );
    });

    it('should generate headline for multiple strong factors', () => {
      const subScores: OpportunitySubScores = {
        severity: 80,
        signalDensity: 85,
        priceMomentum: 90,
        volume: 50,
        trend: 50,
        preferenceAlignment: 50,
      };

      const explanation = buildOpportunityExplanation(subScores);

      // Should match strong severity + strong density rule first
      expect(explanation.headline).toBe(
        'High-severity signals with strong confluence create compelling opportunity.'
      );
    });

    it('should generate default neutral headline', () => {
      const subScores: OpportunitySubScores = {
        severity: 50,
        signalDensity: 50,
        priceMomentum: 50,
        volume: 50,
        trend: 50,
        preferenceAlignment: 50,
      };

      const explanation = buildOpportunityExplanation(subScores);

      expect(explanation.headline).toBe(
        'Moderate signals and market conditions suggest neutral setup.'
      );
    });

    it('should generate headline for mixed signals', () => {
      const subScores: OpportunitySubScores = {
        severity: 85, // strong
        signalDensity: 30, // weak
        priceMomentum: 25, // weak
        volume: 50, // neutral
        trend: 50, // neutral
        preferenceAlignment: 50, // neutral
      };

      const explanation = buildOpportunityExplanation(subScores);

      // Should match strong severity but weak density rule
      expect(explanation.headline).toBe(
        'High-severity signal present but limited confluence with other indicators.'
      );
    });
  });

  describe('complete explanation', () => {
    it('should return complete explanation with headline and factors', () => {
      const subScores: OpportunitySubScores = {
        severity: 75,
        signalDensity: 60,
        priceMomentum: 80,
        volume: 40,
        trend: 90,
        preferenceAlignment: 50,
      };

      const explanation = buildOpportunityExplanation(subScores);

      expect(explanation).toHaveProperty('headline');
      expect(explanation).toHaveProperty('factors');
      expect(typeof explanation.headline).toBe('string');
      expect(Array.isArray(explanation.factors)).toBe(true);
      expect(explanation.headline.length).toBeGreaterThan(0);
      expect(explanation.factors.length).toBe(6);
    });

    it('should handle edge case scores (0 and 100)', () => {
      const subScores: OpportunitySubScores = {
        severity: 0,
        signalDensity: 100,
        priceMomentum: 0,
        volume: 100,
        trend: 0,
        preferenceAlignment: 100,
      };

      const explanation = buildOpportunityExplanation(subScores);

      expect(explanation.factors).toHaveLength(6);
      expect(explanation.headline).toBeTruthy();

      const factorMap = new Map(explanation.factors.map((f) => [f.key, f]));
      expect(factorMap.get('severity')?.verdict).toBe('weak');
      expect(factorMap.get('density')?.verdict).toBe('strong');
    });
  });
});
