/**
 * Example: Testing Custom Accessibility Rules
 * 
 * This file demonstrates how to write tests for custom accessibility rules
 * that you might add to the MCP Accessibility Evaluator.
 */

import { AccessibilityEvaluator } from '../accessibility-evaluator.js';
import { AccessibilityIssue } from '../types.js';
import * as cheerio from 'cheerio';

// Example custom rule: Check for buttons with only icons (no text)
function checkIconOnlyButtons($: cheerio.CheerioAPI): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  $('button').each((_: number, element: any) => {
    const $el = $(element);
    const text = $el.text().trim();
    const ariaLabel = $el.attr('aria-label');
    const ariaLabelledby = $el.attr('aria-labelledby');
    const title = $el.attr('title');
    
    // Check if button has an icon (simplified check)
    const hasIcon = $el.find('svg, i, .icon').length > 0 || 
                   $el.attr('class')?.includes('icon');
    
    // If button has icon but no accessible text
    if (hasIcon && !text && !ariaLabel && !ariaLabelledby && !title) {
      issues.push({
        type: 'error',
        rule: 'Custom: Icon-only buttons',
        message: 'Icon-only buttons must have accessible text (aria-label, aria-labelledby, or title)',
        element: $el.prop('outerHTML')?.substring(0, 100),
        selector: (() => {
          const classAttr = $el.attr('class');
          return `button${classAttr ? '.' + classAttr.split(' ').join('.') : ''}`;
        })(),
        standard: 'WCAG',
        level: 'A',
        impact: 'serious'
      });
    }
  });
  
  return issues;
}

describe('Custom Accessibility Rules', () => {
  describe('Icon-only buttons check', () => {
    it('should detect buttons with icons but no accessible text', () => {
      const html = `
        <html>
          <body>
            <button><i class="icon-close"></i></button>
            <button><svg><!-- icon --></svg></button>
            <button class="icon-button"></button>
          </body>
        </html>
      `;
      
      const $ = cheerio.load(html);
      const issues = checkIconOnlyButtons($);
      
      expect(issues).toHaveLength(3);
      expect(issues[0].message).toContain('Icon-only buttons must have accessible text');
    });
    
    it('should pass buttons with proper accessible text', () => {
      const html = `
        <html>
          <body>
            <button aria-label="Close dialog"><i class="icon-close"></i></button>
            <button title="Save document"><svg><!-- icon --></svg></button>
            <button aria-labelledby="save-label" class="icon-button"></button>
            <button><i class="icon-edit"></i> Edit</button>
          </body>
        </html>
      `;
      
      const $ = cheerio.load(html);
      const issues = checkIconOnlyButtons($);
      
      expect(issues).toHaveLength(0);
    });
    
    it('should integrate with AccessibilityEvaluator', async () => {
      // This demonstrates how you might extend the evaluator
      const evaluator = new AccessibilityEvaluator();
      // Add custom rule directly for test purposes (not recommended for production)
      (evaluator as any).wcagRules.set('icon-only-buttons', {
        check: checkIconOnlyButtons
      });
      const html = `
        <html>
          <body>
            <button><i class="icon-close"></i></button>
            <button aria-label="Save"><i class="icon-save"></i></button>
          </body>
        </html>
      `;
      const result = await evaluator.evaluateHTML(html);
      const customIssues = result.issues.filter(i => 
        i.rule.includes('Icon-only buttons')
      );
      expect(customIssues).toHaveLength(1);
    });
  });
  
  describe('Example: Testing complex scenarios', () => {
    it('should handle dynamic content scenarios', () => {
      const html = `
        <html>
          <body>
            <div role="region" aria-live="polite">
              <button class="notification-close">
                <svg><!-- X icon --></svg>
              </button>
              <p>New notification</p>
            </div>
          </body>
        </html>
      `;
      
      const $ = cheerio.load(html);
      const issues = checkIconOnlyButtons($);
      
      expect(issues).toHaveLength(1);
      expect(issues[0].selector).toContain('notification-close');
    });
    
    it('should provide helpful recommendations', () => {
      const html = '<button class="toolbar-btn icon-print"></button>';
      
      const $ = cheerio.load(html);
      const issues = checkIconOnlyButtons($);
      
      expect(issues[0].message).toContain('aria-label');
      expect(issues[0].impact).toBe('serious');
    });
  });
}); 