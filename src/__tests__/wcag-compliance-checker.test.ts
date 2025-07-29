import { WCAGComplianceChecker } from '../wcag-compliance-checker.js';
import { EvaluationResult } from '../types.js';

describe('WCAGComplianceChecker', () => {
  let checker: WCAGComplianceChecker;

  beforeEach(() => {
    checker = new WCAGComplianceChecker();
  });

  describe('evaluateCompliance', () => {
    it('should determine compliance level None when Level A criteria fail', () => {
      const evaluationResult: EvaluationResult = {
        issues: [
          {
            type: 'error',
            rule: 'WCAG 1.1.1',
            message: 'Images must have alternative text',
            standard: 'WCAG',
            level: 'A',
            impact: 'critical'
          }
        ],
        summary: {
          totalIssues: 1,
          errors: 1,
          warnings: 0,
          info: 0,
          byStandard: { WCAG: 1 },
          byImpact: { critical: 1 }
        },
        passedChecks: []
      };

      const report = checker.evaluateCompliance(evaluationResult);

      expect(report.level).toBe('None');
      expect(report.failedCriteria).toHaveLength(1);
      expect(report.failedCriteria[0].id).toBe('1.1.1');
    });

    it('should determine compliance level A when only AA criteria fail', () => {
      const evaluationResult: EvaluationResult = {
        issues: [
          {
            type: 'error',
            rule: 'WCAG 1.4.3',
            message: 'Insufficient color contrast',
            standard: 'WCAG',
            level: 'AA',
            impact: 'serious'
          }
        ],
        summary: {
          totalIssues: 1,
          errors: 1,
          warnings: 0,
          info: 0,
          byStandard: { WCAG: 1 },
          byImpact: { serious: 1 }
        },
        passedChecks: ['WCAG: images-alt-text', 'WCAG: form-labels']
      };

      const report = checker.evaluateCompliance(evaluationResult);

      expect(report.level).toBe('A');
      expect(report.failedCriteria).toHaveLength(1);
      expect(report.failedCriteria[0].id).toBe('1.4.3');
      expect(report.failedCriteria[0].level).toBe('AA');
    });

    it('should calculate overall score correctly', () => {
      const evaluationResult: EvaluationResult = {
        issues: [
          {
            type: 'error',
            rule: 'WCAG 1.4.3',
            message: 'Insufficient color contrast',
            standard: 'WCAG',
            level: 'AA',
            impact: 'serious'
          }
        ],
        summary: {
          totalIssues: 1,
          errors: 1,
          warnings: 0,
          info: 0,
          byStandard: { WCAG: 1 },
          byImpact: { serious: 1 }
        },
        passedChecks: [
          'WCAG: images-alt-text',
          'WCAG: form-labels',
          'WCAG: headings-structure'
        ]
      };

      const report = checker.evaluateCompliance(evaluationResult);

      // We have criteria for 1.1.1, 1.3.1, and 1.4.3 being tested
      // 2 passed (1.1.1, 1.3.1), 1 failed (1.4.3)
      expect(report.overallScore).toBeGreaterThan(0);
      expect(report.overallScore).toBeLessThan(100);
    });

    it('should calculate detailed scores by principle', () => {
      const evaluationResult: EvaluationResult = {
        issues: [],
        summary: {
          totalIssues: 0,
          errors: 0,
          warnings: 0,
          info: 0,
          byStandard: {},
          byImpact: {}
        },
        passedChecks: [
          'WCAG: images-alt-text',
          'WCAG: headings-structure',
          'WCAG: form-labels'
        ]
      };

      const report = checker.evaluateCompliance(evaluationResult);

      expect(report.detailedScores.perceivable).toBeGreaterThan(0);
      expect(report.detailedScores.operable).toBe(0); // No operable criteria tested
      expect(report.detailedScores.understandable).toBe(0); // No understandable criteria tested
      expect(report.detailedScores.robust).toBe(0); // No robust criteria tested
    });

    it('should mark criteria as not applicable when not tested', () => {
      const evaluationResult: EvaluationResult = {
        issues: [],
        summary: {
          totalIssues: 0,
          errors: 0,
          warnings: 0,
          info: 0,
          byStandard: {},
          byImpact: {}
        },
        passedChecks: ['WCAG: images-alt-text']
      };

      const report = checker.evaluateCompliance(evaluationResult);

      expect(report.notApplicableCriteria.length).toBeGreaterThan(0);
      expect(report.passedCriteria).toHaveLength(1);
      expect(report.passedCriteria[0].id).toBe('1.1.1');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for failed criteria', () => {
      const report = checker.evaluateCompliance({
        issues: [
          {
            type: 'error',
            rule: 'WCAG 1.1.1',
            message: 'Images must have alternative text',
            standard: 'WCAG',
            level: 'A',
            impact: 'critical'
          },
          {
            type: 'error',
            rule: 'WCAG 1.4.3',
            message: 'Insufficient color contrast',
            standard: 'WCAG',
            level: 'AA',
            impact: 'serious'
          }
        ],
        summary: {
          totalIssues: 2,
          errors: 2,
          warnings: 0,
          info: 0,
          byStandard: { WCAG: 2 },
          byImpact: { critical: 1, serious: 1 }
        },
        passedChecks: []
      });

      const recommendations = checker.generateRecommendations(report.failedCriteria);

      expect(recommendations).toHaveLength(2);
      expect(recommendations[0]).toContain('1.1.1');
      expect(recommendations[0]).toContain('Non-text Content');
      expect(recommendations[0]).toContain('techniques');
      expect(recommendations[1]).toContain('1.4.3');
      expect(recommendations[1]).toContain('Contrast (Minimum)');
    });

    it('should handle empty failed criteria', () => {
      const recommendations = checker.generateRecommendations([]);
      expect(recommendations).toHaveLength(0);
    });
  });

  describe('compliance level calculation', () => {
    it('should handle mixed pass/fail scenarios correctly', () => {
      const testCases = [
        {
          issues: ['WCAG 1.1.1'], // Level A fail
          expectedLevel: 'None'
        },
        {
          issues: ['WCAG 1.4.3'], // Level AA fail
          expectedLevel: 'A'
        },
        {
          issues: [], // All pass
          expectedLevel: 'A' // At minimum if we have some A criteria passing
        }
      ];

      testCases.forEach(testCase => {
        const evaluationResult: EvaluationResult = {
          issues: testCase.issues.map(rule => ({
            type: 'error' as const,
            rule,
            message: 'Test issue',
            standard: 'WCAG' as const,
            level: rule.includes('1.4.3') ? 'AA' as const : 'A' as const,
            impact: 'serious' as const
          })),
          summary: {
            totalIssues: testCase.issues.length,
            errors: testCase.issues.length,
            warnings: 0,
            info: 0,
            byStandard: { WCAG: testCase.issues.length },
            byImpact: { serious: testCase.issues.length }
          },
          passedChecks: ['WCAG: images-alt-text', 'WCAG: form-labels']
        };

        const report = checker.evaluateCompliance(evaluationResult);
        expect(report.level).toBe(testCase.expectedLevel);
      });
    });
  });
}); 