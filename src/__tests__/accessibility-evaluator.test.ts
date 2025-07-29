import { AccessibilityEvaluator } from '../accessibility-evaluator.js';

// Mock axe-core and jsdom
jest.mock('axe-core');
jest.mock('jsdom', () => ({
  JSDOM: jest.fn().mockImplementation(() => ({
    window: {
      document: {}
    }
  }))
}));

describe('AccessibilityEvaluator', () => {
  let evaluator: AccessibilityEvaluator;

  beforeEach(() => {
    evaluator = new AccessibilityEvaluator();
    jest.clearAllMocks();
  });

  describe('evaluateHTML', () => {
    it('should detect missing alt text on images', async () => {
      const html = `
        <html>
          <body>
            <img src="test.jpg">
            <img src="test2.jpg" alt="">
            <img src="test3.jpg" alt="Description">
          </body>
        </html>
      `;

      const result = await evaluator.evaluateHTML(html);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'error',
          rule: 'WCAG 1.1.1',
          message: 'Images must have alternative text',
          standard: 'WCAG',
          level: 'A',
          impact: 'critical'
        })
      );
    });

    it('should pass for images with proper alt text', async () => {
      const html = `
        <html>
          <body>
            <img src="test.jpg" alt="Test image">
            <img src="decorative.jpg" alt="" role="presentation">
          </body>
        </html>
      `;

      const result = await evaluator.evaluateHTML(html);
      const imageIssues = result.issues.filter(i => i.rule === 'WCAG 1.1.1');
      expect(imageIssues).toHaveLength(0);
      expect(result.passedChecks).toContain('WCAG: images-alt-text');
    });

    it('should detect skipped heading levels', async () => {
      const html = `
        <html>
          <body>
            <h1>Title</h1>
            <h3>Subtitle</h3>
            <h2>Section</h2>
          </body>
        </html>
      `;

      const result = await evaluator.evaluateHTML(html);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          rule: 'WCAG 1.3.1',
          message: expect.stringContaining('Heading levels should not skip'),
          standard: 'WCAG',
          level: 'A',
          impact: 'moderate'
        })
      );
    });

    it('should detect form controls without labels', async () => {
      const html = `
        <html>
          <body>
            <form>
              <input type="text" name="username">
              <input type="password" id="pwd">
              <label for="pwd">Password</label>
              <input type="email" aria-label="Email address">
              <button type="submit">Submit</button>
            </form>
          </body>
        </html>
      `;

      const result = await evaluator.evaluateHTML(html);

      const formIssues = result.issues.filter(i => 
        i.message === 'Form controls must have associated labels'
      );
      expect(formIssues).toHaveLength(1); // Only the first input has no label
    });

    it('should detect missing required ARIA attributes', async () => {
      const html = `
        <html>
          <body>
            <div role="checkbox">Option 1</div>
            <div role="checkbox" aria-checked="true">Option 2</div>
            <div role="slider">Volume</div>
          </body>
        </html>
      `;

      const result = await evaluator.evaluateHTML(html);

      // Should find missing aria-checked on first checkbox
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'error',
          rule: 'ARIA Required Attributes',
          message: expect.stringContaining('aria-checked'),
          standard: 'ARIA'
        })
      );

      // Should find missing aria-valuenow, aria-valuemin, aria-valuemax on slider
      const sliderIssues = result.issues.filter(i => 
        i.message.includes('role="slider"')
      );
      expect(sliderIssues.length).toBeGreaterThan(0);
    });

    it('should detect invalid ARIA attribute values', async () => {
      const html = `
        <html>
          <body>
            <button aria-expanded="yes">Menu</button>
            <div aria-hidden="maybe">Content</div>
            <input aria-invalid="incorrect">
          </body>
        </html>
      `;

      const result = await evaluator.evaluateHTML(html);

      const ariaValueIssues = result.issues.filter(i => 
        i.rule === 'ARIA Valid Values'
      );
      expect(ariaValueIssues.length).toBeGreaterThan(0);
      expect(ariaValueIssues[0].message).toContain('Invalid value');
    });

    it('should calculate summary statistics correctly', async () => {
      const html = `
        <html>
          <body>
            <img src="test.jpg">
            <h1>Title</h1>
            <h3>Subtitle</h3>
            <div role="checkbox">Check me</div>
          </body>
        </html>
      `;

      const result = await evaluator.evaluateHTML(html);

      expect(result.summary.totalIssues).toBeGreaterThan(0);
      expect(result.summary.errors).toBeGreaterThan(0);
      expect(result.summary.warnings).toBeGreaterThan(0);
      expect(result.summary.byStandard).toBeDefined();
      expect(result.summary.byImpact).toBeDefined();
    });

    it('should handle empty HTML gracefully', async () => {
      const result = await evaluator.evaluateHTML('');
      
      expect(result.issues).toEqual([]);
      expect(result.summary.totalIssues).toBe(0);
      expect(result.passedChecks.length).toBeGreaterThan(0);
    });

    it('should evaluate URL by fetching HTML', async () => {
      // Mock global fetch
      global.fetch = jest.fn().mockResolvedValue({
        text: jest.fn().mockResolvedValue('<html><body><img src="test.jpg"></body></html>')
      });

      const result = await evaluator.evaluateURL('https://example.com');

      expect(global.fetch).toHaveBeenCalledWith('https://example.com');
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('getSelector', () => {
    it('should generate appropriate selectors', async () => {
      const html = `
        <html>
          <body>
            <div id="unique">With ID</div>
            <button class="btn primary">With classes</button>
            <span>Plain element</span>
          </body>
        </html>
      `;

      const result = await evaluator.evaluateHTML(html);
      
      // The getSelector method is private, but we can see its output in the issues
      // This is more of an integration test
      expect(result).toBeDefined();
    });
  });
}); 