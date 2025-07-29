import { ARIAValidator } from '../aria-validator.js';

describe('ARIAValidator', () => {
  let validator: ARIAValidator;

  beforeEach(() => {
    validator = new ARIAValidator();
  });

  describe('validate', () => {
    it('should detect invalid ARIA roles', () => {
      const html = `
        <html>
          <body>
            <div role="invalid-role">Content</div>
            <div role="button">Valid button</div>
          </body>
        </html>
      `;

      const result = validator.validate(html);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'error',
          message: 'Invalid ARIA role: "invalid-role"',
          specification: 'WAI-ARIA 1.2'
        })
      );
      expect(result.validUsages).toContainEqual(
        expect.stringContaining('Correct use of role="button"')
      );
    });

    it('should detect missing required ARIA properties', () => {
      const html = `
        <html>
          <body>
            <div role="checkbox">Option 1</div>
            <div role="checkbox" aria-checked="true">Option 2</div>
            <div role="slider">Volume Control</div>
          </body>
        </html>
      `;

      const result = validator.validate(html);

      const checkboxIssues = result.issues.filter(i => 
        i.message.includes('aria-checked') && i.message.includes('checkbox')
      );
      expect(checkboxIssues).toHaveLength(1);

      const sliderIssues = result.issues.filter(i => 
        i.message.includes('slider')
      );
      expect(sliderIssues.length).toBeGreaterThan(0);
    });

    it('should detect invalid parent-child relationships', () => {
      const html = `
        <html>
          <body>
            <div role="menu">
              <div role="menuitem">Valid item</div>
            </div>
            <div>
              <div role="tab">Invalid - no tablist parent</div>
            </div>
            <div role="tablist">
              <div role="tab">Valid tab</div>
            </div>
          </body>
        </html>
      `;

      const result = validator.validate(html);

      const parentIssues = result.issues.filter(i => 
        i.message.includes('must be contained within')
      );
      expect(parentIssues).toHaveLength(1);
      expect(parentIssues[0].message).toContain('tab');
      expect(parentIssues[0].message).toContain('tablist');
    });

    it('should detect empty ARIA attributes', () => {
      const html = `
        <html>
          <body>
            <nav aria-label="">Empty label</nav>
            <div aria-describedby="">Content</div>
          </body>
        </html>
      `;

      const result = validator.validate(html);

      const emptyValueIssues = result.issues.filter(i => 
        i.type === 'warning' && i.message.includes('Empty value')
      );
      expect(emptyValueIssues).toHaveLength(2);
    });

    it('should detect non-existent ID references', () => {
      const html = `
        <html>
          <body>
            <div aria-labelledby="missing-id">Content</div>
            <div aria-labelledby="existing-id">More content</div>
            <h2 id="existing-id">Heading</h2>
          </body>
        </html>
      `;

      const result = validator.validate(html);

      const idIssues = result.issues.filter(i => 
        i.message.includes('non-existent ID')
      );
      expect(idIssues).toHaveLength(1);
      expect(idIssues[0].message).toContain('missing-id');
    });

    it('should detect redundant ARIA roles', () => {
      const html = `
        <html>
          <body>
            <nav role="navigation">Navigation</nav>
            <main role="main">Main content</main>
            <button role="button">Click me</button>
            <aside role="complementary">Sidebar</aside>
          </body>
        </html>
      `;

      const result = validator.validate(html);

      const redundantIssues = result.issues.filter(i => 
        i.message.includes('Redundant ARIA role')
      );
      expect(redundantIssues).toHaveLength(4);
      expect(redundantIssues.every(i => i.type === 'warning')).toBe(true);
    });

    it('should detect aria-hidden on focusable elements', () => {
      const html = `
        <html>
          <body>
            <div aria-hidden="true">
              <button>Hidden button</button>
              <a href="#">Hidden link</a>
              <input type="text" placeholder="Hidden input">
            </div>
            <div aria-hidden="true">
              <span>Non-focusable content is OK</span>
            </div>
          </body>
        </html>
      `;

      const result = validator.validate(html);

      const hiddenFocusableIssues = result.issues.filter(i => 
        i.message.includes('aria-hidden="true" on focusable')
      );
      expect(hiddenFocusableIssues).toHaveLength(1);
      expect(hiddenFocusableIssues[0].type).toBe('error');
    });

    it('should detect multiple landmarks without labels', () => {
      const html = `
        <html>
          <body>
            <nav role="navigation">Nav 1</nav>
            <nav role="navigation">Nav 2</nav>
            <nav role="navigation" aria-label="Primary">Nav 3</nav>
            <main role="main">Main 1</main>
            <div role="main">Main 2</div>
          </body>
        </html>
      `;

      const result = validator.validate(html);

      const multipleMainIssues = result.issues.filter(i => 
        i.message.includes('Multiple main landmarks')
      );
      expect(multipleMainIssues).toHaveLength(1);

      const unlabeledNavIssues = result.issues.filter(i => 
        i.message.includes('Multiple navigation landmarks without unique labels')
      );
      expect(unlabeledNavIssues).toHaveLength(1);
    });

    it('should collect usage statistics', () => {
      const html = `
        <html>
          <body>
            <div role="button" aria-pressed="false" aria-label="Toggle">Button</div>
            <nav role="navigation" aria-label="Main navigation">
              <ul role="menu">
                <li role="menuitem">Item 1</li>
              </ul>
            </nav>
          </body>
        </html>
      `;

      const result = validator.validate(html);

      expect(result.statistics.totalARIAElements).toBeGreaterThan(0);
      expect(result.statistics.rolesUsed.has('button')).toBe(true);
      expect(result.statistics.rolesUsed.has('navigation')).toBe(true);
      expect(result.statistics.rolesUsed.has('menu')).toBe(true);
      expect(result.statistics.rolesUsed.has('menuitem')).toBe(true);
      expect(result.statistics.propertiesUsed.has('aria-pressed')).toBe(true);
      expect(result.statistics.propertiesUsed.has('aria-label')).toBe(true);
    });
  });

  describe('generateReport', () => {
    it('should generate a formatted report with no issues', () => {
      const result = {
        issues: [],
        validUsages: ['Valid usage 1', 'Valid usage 2'],
        statistics: {
          totalARIAElements: 5,
          rolesUsed: new Set(['button', 'navigation']),
          propertiesUsed: new Set(['aria-label', 'aria-pressed']),
          statesUsed: new Set(['aria-pressed'])
        }
      };

      const report = validator.generateReport(result);

      expect(report).toContain('ARIA Validation Report');
      expect(report).toContain('✅ No ARIA validation issues found!');
      expect(report).toContain('Total ARIA elements found: 5');
      expect(report).toContain('button, navigation');
      expect(report).toContain('aria-label, aria-pressed');
    });

    it('should generate a formatted report with errors and warnings', () => {
      const result = {
        issues: [
          {
            type: 'error' as const,
            element: '<div role="invalid">',
            selector: 'div',
            message: 'Invalid ARIA role',
            recommendation: 'Use a valid role',
            specification: 'WAI-ARIA 1.2'
          },
          {
            type: 'warning' as const,
            element: '<nav role="navigation">',
            selector: 'nav',
            message: 'Redundant ARIA role',
            recommendation: 'Remove redundant role',
            specification: 'WAI-ARIA 1.2'
          }
        ],
        validUsages: [],
        statistics: {
          totalARIAElements: 2,
          rolesUsed: new Set(['invalid', 'navigation']),
          propertiesUsed: new Set<string>(),
          statesUsed: new Set<string>()
        }
      };

      const report = validator.generateReport(result);

      expect(report).toContain('⚠️ Found 2 ARIA validation issues');
      expect(report).toContain('## Errors (1)');
      expect(report).toContain('## Warnings (1)');
      expect(report).toContain('Invalid ARIA role');
      expect(report).toContain('Redundant ARIA role');
      expect(report).toContain('Element: div');
      expect(report).toContain('Element: nav');
    });
  });
}); 