
import { AccessibilityIssue, EvaluationResult, WCAGCriterion, WCAGComplianceReport } from './types.js';

export class WCAGComplianceChecker {
  private criteria: Map<string, WCAGCriterion>;
  
  constructor() {
    this.criteria = new Map();
    this.initializeCriteria();
  }

  private initializeCriteria(): void {
    // WCAG 2.1 Level A Criteria
    this.criteria.set('1.1.1', {
      id: '1.1.1',
      name: 'Non-text Content',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.1 Text Alternatives',
      techniques: ['H37', 'H36', 'H35', 'H53', 'ARIA6', 'ARIA10'],
      commonFailures: ['F3', 'F13', 'F20', 'F30', 'F38', 'F39', 'F65']
    });

    this.criteria.set('1.2.1', {
      id: '1.2.1',
      name: 'Audio-only and Video-only (Prerecorded)',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.2 Time-based Media',
      techniques: ['G158', 'G159', 'G166'],
      commonFailures: []
    });

    this.criteria.set('1.3.1', {
      id: '1.3.1',
      name: 'Info and Relationships',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.3 Adaptable',
      techniques: ['ARIA11', 'ARIA12', 'ARIA13', 'ARIA16', 'ARIA17', 'G115', 'H39', 'H42', 'H43', 'H44', 'H48'],
      commonFailures: ['F2', 'F33', 'F34', 'F42', 'F43', 'F46']
    });

    this.criteria.set('1.4.1', {
      id: '1.4.1',
      name: 'Use of Color',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.4 Distinguishable',
      techniques: ['G14', 'G111', 'G182', 'G183'],
      commonFailures: ['F13', 'F73', 'F81']
    });

    this.criteria.set('2.1.1', {
      id: '2.1.1',
      name: 'Keyboard',
      level: 'A',
      principle: 'Operable',
      guideline: '2.1 Keyboard Accessible',
      techniques: ['G202', 'H91', 'SCR20', 'SCR35'],
      commonFailures: ['F10', 'F42', 'F54', 'F55']
    });

    this.criteria.set('2.4.1', {
      id: '2.4.1',
      name: 'Bypass Blocks',
      level: 'A',
      principle: 'Operable',
      guideline: '2.4 Navigable',
      techniques: ['G1', 'G123', 'G124', 'H69', 'H70', 'H64', 'SCR28'],
      commonFailures: []
    });

    this.criteria.set('3.1.1', {
      id: '3.1.1',
      name: 'Language of Page',
      level: 'A',
      principle: 'Understandable',
      guideline: '3.1 Readable',
      techniques: ['H57'],
      commonFailures: []
    });

    this.criteria.set('4.1.1', {
      id: '4.1.1',
      name: 'Parsing',
      level: 'A',
      principle: 'Robust',
      guideline: '4.1 Compatible',
      techniques: ['G134', 'G192', 'H88', 'H74', 'H75', 'H93', 'H94'],
      commonFailures: ['F70', 'F77']
    });

    // Level AA criteria
    this.criteria.set('1.4.3', {
      id: '1.4.3',
      name: 'Contrast (Minimum)',
      level: 'AA',
      principle: 'Perceivable',
      guideline: '1.4 Distinguishable',
      techniques: ['G18', 'G148', 'G174', 'G145'],
      commonFailures: ['F24', 'F83']
    });

    this.criteria.set('1.4.5', {
      id: '1.4.5',
      name: 'Images of Text',
      level: 'AA',
      principle: 'Perceivable',
      guideline: '1.4 Distinguishable',
      techniques: ['C22', 'C30', 'G140'],
      commonFailures: []
    });

    this.criteria.set('2.4.6', {
      id: '2.4.6',
      name: 'Headings and Labels',
      level: 'AA',
      principle: 'Operable',
      guideline: '2.4 Navigable',
      techniques: ['G130', 'G131'],
      commonFailures: []
    });

    this.criteria.set('3.3.3', {
      id: '3.3.3',
      name: 'Error Suggestion',
      level: 'AA',
      principle: 'Understandable',
      guideline: '3.3 Input Assistance',
      techniques: ['G83', 'G84', 'G85', 'G177', 'SCR18', 'SCR32'],
      commonFailures: []
    });

    // Level AAA criteria  
    this.criteria.set('1.4.6', {
      id: '1.4.6',
      name: 'Contrast (Enhanced)',
      level: 'AAA',
      principle: 'Perceivable',
      guideline: '1.4 Distinguishable',
      techniques: ['G17', 'G18', 'G148', 'G174'],
      commonFailures: ['F24', 'F83']
    });

    this.criteria.set('2.4.9', {
      id: '2.4.9',
      name: 'Link Purpose (Link Only)',
      level: 'AAA',
      principle: 'Operable',
      guideline: '2.4 Navigable',
      techniques: ['ARIA7', 'ARIA8', 'H30', 'H24'],
      commonFailures: []
    });

    this.criteria.set('3.1.5', {
      id: '3.1.5',
      name: 'Reading Level',
      level: 'AAA',
      principle: 'Understandable',
      guideline: '3.1 Readable',
      techniques: ['G86', 'G103', 'G79', 'G153', 'G160'],
      commonFailures: []
    });
  }

  /**
   * Filter criteria based on target level
   * @param targetLevel - The target WCAG level ('A', 'AA', or 'AAA')
   * @returns Map of criteria that should be evaluated for the target level
   */
  private getApplicableCriteria(targetLevel: 'A' | 'AA' | 'AAA'): Map<string, WCAGCriterion> {
    const applicableCriteria = new Map<string, WCAGCriterion>();
    
    // Define level hierarchy
    const levelOrder = ['A', 'AA', 'AAA'];
    const targetIndex = levelOrder.indexOf(targetLevel);
    
    if (targetIndex === -1) {
      throw new Error(`Invalid target level: ${targetLevel}`);
    }
    
    // Include all criteria up to and including the target level
    for (const [id, criterion] of this.criteria) {
      const criterionIndex = levelOrder.indexOf(criterion.level);
      if (criterionIndex <= targetIndex) {
        applicableCriteria.set(id, criterion);
      }
    }
    
    return applicableCriteria;
  }

  evaluateCompliance(evaluationResult: EvaluationResult, targetLevel: 'A' | 'AA' | 'AAA' = 'AA'): WCAGComplianceReport {
    // Get criteria applicable to the target level
    const applicableCriteria = this.getApplicableCriteria(targetLevel);
    
    const passedCriteria: WCAGCriterion[] = [];
    const failedCriteria: WCAGCriterion[] = [];
    const notApplicableCriteria: WCAGCriterion[] = [];

    // Map issues to criteria
    const criteriaIssues = new Map<string, AccessibilityIssue[]>();
    
    evaluationResult.issues.forEach(issue => {
      if (issue.rule.startsWith('WCAG')) {
        const criterionId = issue.rule.replace('WCAG ', '');
        if (!criteriaIssues.has(criterionId)) {
          criteriaIssues.set(criterionId, []);
        }
        criteriaIssues.get(criterionId)!.push(issue);
      }
    });

    // Evaluate each applicable criterion
    applicableCriteria.forEach((criterion, id) => {
      const issues = criteriaIssues.get(id) || [];
      
      if (issues.length > 0) {
        failedCriteria.push(criterion);
      } else if (this.isCriterionApplicable(criterion, evaluationResult)) {
        passedCriteria.push(criterion);
      } else {
        notApplicableCriteria.push(criterion);
      }
    });

    // Calculate compliance level based on target level
    const level = this.calculateComplianceLevel(passedCriteria, failedCriteria, targetLevel);
    
    // Calculate scores
    const overallScore = this.calculateOverallScore(passedCriteria, failedCriteria);
    const detailedScores = this.calculateDetailedScores(passedCriteria, failedCriteria);

    return {
      level,
      passedCriteria,
      failedCriteria,
      notApplicableCriteria,
      overallScore,
      detailedScores
    };
  }

  private isCriterionApplicable(criterion: WCAGCriterion, evaluationResult: EvaluationResult): boolean {
    // Simple heuristic to determine if a criterion is applicable
    // In a real implementation, this would be more sophisticated
    
    // Check if there are passed checks related to this criterion
    const relatedChecks = evaluationResult.passedChecks.filter(check => 
      check.includes(criterion.id) || 
      check.toLowerCase().includes(criterion.name.toLowerCase().replace(/\s+/g, '-'))
    );
    
    return relatedChecks.length > 0;
  }

  private calculateComplianceLevel(
    passed: WCAGCriterion[], 
    failed: WCAGCriterion[], 
    targetLevel: 'A' | 'AA' | 'AAA'
  ): 'A' | 'AA' | 'AAA' | 'None' {
    // Check if we meet the target level by ensuring no failures at or below target level
    const levelOrder = ['A', 'AA', 'AAA'];
    const targetIndex = levelOrder.indexOf(targetLevel);
    
    // Check for failures at each level up to target
    for (let i = 0; i <= targetIndex; i++) {
      const currentLevel = levelOrder[i] as 'A' | 'AA' | 'AAA';
      const failuresAtLevel = failed.filter(c => c.level === currentLevel);
      
      if (failuresAtLevel.length > 0) {
        // If we have failures at level A, we meet no level
        if (currentLevel === 'A') {
          return 'None';
        }
        // If we have failures at AA, we only meet A (if no A failures)
        if (currentLevel === 'AA') {
          return 'A';
        }
        // If we have failures at AAA, we meet AA (if no AA failures)
        if (currentLevel === 'AAA') {
          return 'AA';
        }
      }
    }
    
    // No failures found at target level or below, check what we can claim
    const passedA = passed.filter(c => c.level === 'A').length;
    const passedAA = passed.filter(c => c.level === 'AA').length;
    const passedAAA = passed.filter(c => c.level === 'AAA').length;
    
    // To claim a level, we need to have passed criteria at that level and below
    if (targetLevel === 'AAA' && passedAAA > 0 && passedAA > 0 && passedA > 0) {
      return 'AAA';
    } else if (targetLevel >= 'AA' && passedAA > 0 && passedA > 0) {
      return 'AA';
    } else if (passedA > 0) {
      return 'A';
    }
    
    return 'None';
  }

  private calculateOverallScore(passed: WCAGCriterion[], failed: WCAGCriterion[]): number {
    const total = passed.length + failed.length;
    if (total === 0) return 0;
    
    return Math.round((passed.length / total) * 100);
  }

  private calculateDetailedScores(passed: WCAGCriterion[], failed: WCAGCriterion[]): WCAGComplianceReport['detailedScores'] {
    const principles = ['Perceivable', 'Operable', 'Understandable', 'Robust'] as const;
    const scores: WCAGComplianceReport['detailedScores'] = {
      perceivable: 0,
      operable: 0,
      understandable: 0,
      robust: 0
    };

    principles.forEach(principle => {
      const principleKey = principle.toLowerCase() as keyof typeof scores;
      const passedInPrinciple = passed.filter(c => c.principle === principle).length;
      const failedInPrinciple = failed.filter(c => c.principle === principle).length;
      const totalInPrinciple = passedInPrinciple + failedInPrinciple;
      
      if (totalInPrinciple > 0) {
        scores[principleKey] = Math.round((passedInPrinciple / totalInPrinciple) * 100);
      }
    });

    return scores;
  }

  generateRecommendations(failedCriteria: WCAGCriterion[]): string[] {
    const recommendations: string[] = [];
    
    failedCriteria.forEach(criterion => {
      let recommendation = '';
      
      switch (criterion.id) {
        case '1.1.1':
          recommendation = `
🖼️ **${criterion.id} ${criterion.name}**: 
**Why this matters**: Users with visual impairments rely on alternative text to understand images. Without alt text, images are completely inaccessible.

**How to fix**:
1. Add alt attributes to all <img> elements
2. Write descriptive text that conveys the image's purpose and content
3. For decorative images, use alt="" (empty alt attribute)
4. For complex images (charts, diagrams), provide detailed descriptions

**Examples**:
❌ Bad: <img src="chart.jpg">
✅ Good: <img src="chart.jpg" alt="Q3 sales increased 25% compared to Q2">

**Testing**: Use a screen reader or remove CSS to see how content reads without images.
**Resources**: WCAG 2.1 Understanding Non-text Content, WebAIM Alt Text Guidelines`;
          break;
          
        case '1.3.1':
          recommendation = `
📝 **${criterion.id} ${criterion.name}**: 
**Why this matters**: Proper structure helps all users navigate content efficiently, especially screen reader users who rely on headings and form labels.

**How to fix**:
1. Use proper heading hierarchy (h1 → h2 → h3, don't skip levels)
2. Associate form labels with controls using <label for="id"> or aria-label
3. Use semantic HTML elements (nav, main, aside, article)
4. Group related form fields with <fieldset> and <legend>

**Examples**:
❌ Bad: <input type="email"> (no label)
✅ Good: <label for="email">Email</label><input type="email" id="email">

**Testing**: Use browser dev tools to check heading structure, navigate with keyboard only.
**Resources**: WCAG 2.1 Understanding Info and Relationships, WebAIM Form Labels`;
          break;
          
        case '1.4.3':
          recommendation = `
🎨 **${criterion.id} ${criterion.name}**: 
**Why this matters**: Sufficient color contrast ensures text is readable for users with visual impairments, including color blindness and low vision.

**How to fix**:
1. Ensure normal text has at least 4.5:1 contrast ratio
2. Large text (18pt+ or 14pt+ bold) needs at least 3:1 contrast
3. Check contrast for all text, including links and button text
4. Don't rely solely on color to convey information

**Tools**: Use browser dev tools, WebAIM Contrast Checker, or Color Contrast Analyser
**Testing**: View your site in grayscale or simulate color blindness
**Resources**: WCAG 2.1 Understanding Contrast, WebAIM Contrast Checker`;
          break;
          
        case '2.1.1':
          recommendation = `
⌨️ **${criterion.id} ${criterion.name}**: 
**Why this matters**: Many users cannot use a mouse and rely entirely on keyboard navigation due to motor disabilities or assistive technology.

**How to fix**:
1. Ensure all interactive elements are keyboard accessible
2. Provide visible focus indicators
3. Implement logical tab order
4. Add keyboard event handlers alongside mouse events
5. Use tabindex appropriately (0 for focusable, -1 to remove from tab order)

**Testing**: Navigate your entire site using only the Tab, Enter, and arrow keys
**Common issues**: Custom dropdowns, modal dialogs, image carousels
**Resources**: WCAG 2.1 Understanding Keyboard, WebAIM Keyboard Navigation`;
          break;
          
        case '2.4.6':
          recommendation = `
🏷️ **${criterion.id} ${criterion.name}**: 
**Why this matters**: Descriptive headings and labels help users understand page structure and form purposes quickly.

**How to fix**:
1. Write clear, descriptive headings that summarize section content
2. Use specific, meaningful labels for form controls
3. Avoid vague labels like "Click here" or "Submit"
4. Make headings and labels self-explanatory

**Examples**:
❌ Bad: <h2>Info</h2>, <label>Name</label>
✅ Good: <h2>Contact Information</h2>, <label>Full Name (required)</label>

**Testing**: Read only headings and labels - do they make sense?
**Resources**: WCAG 2.1 Understanding Headings and Labels`;
          break;
          
        default:
          recommendation = `
📋 **${criterion.id} ${criterion.name}**: 
**Level**: ${criterion.level} | **Principle**: ${criterion.principle}

**Guideline**: ${criterion.guideline}

**Recommended techniques to implement**: ${criterion.techniques.slice(0, 3).join(', ')}

**Common failure patterns to avoid**: ${criterion.commonFailures.slice(0, 2).join(', ')}

**Next steps**:
1. Review the specific WCAG Success Criterion documentation
2. Identify which techniques apply to your content
3. Implement the most appropriate technique for your use case
4. Test with users and assistive technology

**Resources**: https://www.w3.org/WAI/WCAG21/Understanding/${criterion.id.replace(/\./g, '')}.html`;
      }
      
      recommendations.push(recommendation.trim());
    });

    return recommendations;
  }
} 