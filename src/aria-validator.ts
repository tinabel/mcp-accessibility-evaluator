import * as cheerio from 'cheerio';
import { ARIAValidationIssue, ARIAValidationResult, ARIARole } from './types.js';
  
export class ARIAExplanationGenerator {
  static enhanceIssue(issue: ARIAValidationIssue): ARIAValidationIssue {
    const enhancedIssue = { ...issue };
    
    if (issue.message.includes('Invalid ARIA role')) {
      enhancedIssue.detailedExplanation = 'ARIA roles define what an element is or does on the page. Using invalid or non-existent ARIA roles can confuse assistive technologies and provide incorrect information to users.';
      enhancedIssue.userImpact = 'Screen readers and other assistive technologies may ignore invalid roles or announce them incorrectly, leading to confusion about the element\'s purpose and functionality.';
      enhancedIssue.why = 'ARIA roles must come from the official WAI-ARIA specification to ensure consistent behavior across different assistive technologies and browsers.';
      enhancedIssue.assistiveTechnologyImpact = 'Invalid roles may be ignored by assistive technology, causing the element to fall back to its default semantic meaning or be announced incorrectly.';
      enhancedIssue.howToFix = {
        steps: [
          'Check the WAI-ARIA specification for valid role names',
          'Remove the invalid role attribute',
          'Use a valid ARIA role that matches the element\'s purpose',
          'Consider if a semantic HTML element might be more appropriate'
        ],
        badExample: '<div role="invalid-role">Content</div>',
        goodExample: '<div role="button">Content</div>',
        codeExample: `<!-- Common valid ARIA roles -->
<div role="button">Custom Button</div>
<div role="navigation">Menu</div>
<div role="alert">Important Message</div>
<div role="tablist">
  <div role="tab">Tab 1</div>
  <div role="tab">Tab 2</div>
</div>

<!-- Or use semantic HTML when possible -->
<button>Native Button</button>
<nav>Navigation</nav>`
      };
    } else if (issue.message.includes('Missing required property')) {
      const roleMatch = issue.message.match(/role="([^"]+)"/);
      const propMatch = issue.message.match(/"([^"]+)" for role/);
      const role = roleMatch ? roleMatch[1] : 'unknown';
      const property = propMatch ? propMatch[1] : 'unknown';
      
      enhancedIssue.detailedExplanation = `Elements with role="${role}" must have the ${property} attribute to properly communicate their state to assistive technologies. This property is essential for the role to function correctly.`;
      enhancedIssue.userImpact = `Without ${property}, users of assistive technology cannot understand the current state of the ${role} element, making it difficult or impossible to interact with properly.`;
      enhancedIssue.why = `The ${property} attribute provides critical state information that assistive technologies need to announce the element's current condition to users.`;
      enhancedIssue.assistiveTechnologyImpact = `Screen readers may announce the element without state information, or may not announce it as the intended ${role} type.`;
      enhancedIssue.howToFix = {
        steps: [
          `Add the ${property} attribute to the element`,
          'Set an appropriate value based on the element\'s current state',
          'Update the attribute value when the element\'s state changes',
          'Test with a screen reader to verify the announcement'
        ],
        badExample: `<div role="${role}">Content</div>`,
        goodExample: property === 'aria-checked' 
          ? `<div role="${role}" ${property}="false">Content</div>`
          : `<div role="${role}" ${property}="appropriate-value">Content</div>`,
        codeExample: this.getPropertyExample(role, property)
      };
    } else if (issue.message.includes('aria-labelledby references non-existent ID')) {
      enhancedIssue.detailedExplanation = 'The aria-labelledby attribute creates a relationship between elements by referencing the ID of another element that labels the current element. When the referenced ID doesn\'t exist, this relationship is broken.';
      enhancedIssue.userImpact = 'Screen readers cannot find the labeling text, so users may hear generic announcements like "button" without understanding what the button does.';
      enhancedIssue.why = 'aria-labelledby provides accessible names by referencing existing content, but only works when the referenced element actually exists in the DOM.';
      enhancedIssue.assistiveTechnologyImpact = 'The element will not have an accessible name, or will fall back to less descriptive naming methods.';
      enhancedIssue.howToFix = {
        steps: [
          'Ensure the referenced element exists in the DOM',
          'Check that the ID matches exactly (case-sensitive)',
          'Verify the referenced element contains meaningful text',
          'Consider using aria-label as an alternative if the labeling element doesn\'t exist'
        ],
        badExample: '<button aria-labelledby="missing-id">X</button>',
        goodExample: '<h2 id="section-title">Settings</h2>\n<button aria-labelledby="section-title">X</button>',
        codeExample: `<!-- Ensure referenced elements exist -->
<h2 id="dialog-title">Confirm Delete</h2>
<div role="dialog" aria-labelledby="dialog-title">
  <p id="dialog-description">This action cannot be undone.</p>
  <button aria-labelledby="dialog-title">Delete</button>
  <button>Cancel</button>
</div>

<!-- Alternative with aria-label -->
<button aria-label="Close dialog">X</button>`
      };
    } else if (issue.message.includes('Redundant ARIA role')) {
      enhancedIssue.detailedExplanation = 'HTML elements have implicit semantic meanings that are automatically communicated to assistive technologies. Adding an ARIA role that matches the element\'s implicit semantics is redundant and unnecessary.';
      enhancedIssue.userImpact = 'While redundant roles usually don\'t break functionality, they add unnecessary code and may indicate misunderstanding of semantic HTML.';
      enhancedIssue.why = 'Semantic HTML elements already provide the correct role information. Adding redundant ARIA roles clutters the code without providing additional accessibility benefits.';
      enhancedIssue.assistiveTechnologyImpact = 'No negative impact on assistive technology, but the redundant role declaration is unnecessary.';
      enhancedIssue.howToFix = {
        steps: [
          'Remove the redundant role attribute',
          'Rely on the element\'s implicit semantics',
          'Only add ARIA roles when changing or enhancing semantic meaning'
        ],
        badExample: '<button role="button">Click me</button>',
        goodExample: '<button>Click me</button>',
        codeExample: `<!-- Remove redundant roles -->
<nav>Navigation Menu</nav>  <!-- instead of <nav role="navigation"> -->
<main>Main Content</main>   <!-- instead of <main role="main"> -->
<button>Submit</button>     <!-- instead of <button role="button"> -->

<!-- Use ARIA roles when needed -->
<div role="button" tabindex="0">Custom Button</div>
<div role="navigation">Custom Navigation</div>`
      };
    }
    
    enhancedIssue.relatedGuidelines = ['WAI-ARIA 1.2 Specification', 'WCAG 2.1 Success Criterion 4.1.2 Name, Role, Value'];
    enhancedIssue.documentationLinks = [
      'https://www.w3.org/TR/wai-aria-1.2/',
      'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA',
      'https://www.w3.org/WAI/ARIA/apg/'
    ];
    
    return enhancedIssue;
  }
  
  private static getPropertyExample(role: string, property: string): string {
    const examples: Record<string, Record<string, string>> = {
      'checkbox': {
        'aria-checked': `<!-- Checkbox role with required aria-checked -->
<div role="checkbox" aria-checked="false" tabindex="0">
  Subscribe to newsletter
</div>

<!-- JavaScript to handle state changes -->
<script>
function toggleCheckbox(element) {
  const checked = element.getAttribute('aria-checked') === 'true';
  element.setAttribute('aria-checked', (!checked).toString());
}
</script>`
      },
      'slider': {
        'aria-valuenow': `<!-- Slider role with required properties -->
<div role="slider" 
     aria-valuenow="50" 
     aria-valuemin="0" 
     aria-valuemax="100"
     aria-label="Volume"
     tabindex="0">
  <div class="slider-track">
    <div class="slider-thumb"></div>
  </div>
</div>`
      },
      'combobox': {
        'aria-expanded': `<!-- Combobox role with required aria-expanded -->
<div role="combobox" 
     aria-expanded="false"
     aria-haspopup="listbox"
     aria-controls="options-list">
  <input type="text" placeholder="Search options">
</div>
<ul role="listbox" id="options-list" hidden>
  <li role="option">Option 1</li>
  <li role="option">Option 2</li>
</ul>`
      }
    };
    
    return examples[role]?.[property] || `<!-- Add ${property} to ${role} -->
<div role="${role}" ${property}="appropriate-value">
  Content
</div>`;
  }
}

export class ARIAValidator {
  private roles: Map<string, ARIARole>;
  private properties: Set<string>;
  private states: Set<string>;
  
  constructor() {
    this.roles = new Map();
    this.properties = new Set();
    this.states = new Set();
    this.initializeARIASpec();
  }

  private initializeARIASpec(): void {
    // Initialize ARIA roles
    this.roles.set('button', {
      name: 'button',
      category: 'widget',
      requiredProperties: [],
      supportedProperties: ['aria-expanded', 'aria-pressed', 'aria-disabled'],
      implicitSemantics: 'button'
    });

    this.roles.set('checkbox', {
      name: 'checkbox',
      category: 'widget',
      requiredProperties: ['aria-checked'],
      supportedProperties: ['aria-required', 'aria-readonly', 'aria-disabled']
    });

    this.roles.set('navigation', {
      name: 'navigation',
      category: 'landmark',
      requiredProperties: [],
      supportedProperties: ['aria-label', 'aria-labelledby']
    });

    this.roles.set('main', {
      name: 'main',
      category: 'landmark',
      requiredProperties: [],
      supportedProperties: ['aria-label', 'aria-labelledby']
    });

    this.roles.set('complementary', {
      name: 'complementary',
      category: 'landmark',
      requiredProperties: [],
      supportedProperties: ['aria-label', 'aria-labelledby']
    });

    this.roles.set('menu', {
      name: 'menu',
      category: 'widget',
      requiredProperties: [],
      supportedProperties: ['aria-orientation', 'aria-activedescendant'],
      requiredChildren: ['menuitem', 'menuitemcheckbox', 'menuitemradio']
    });

    this.roles.set('menuitem', {
      name: 'menuitem',
      category: 'widget',
      requiredProperties: [],
      supportedProperties: ['aria-disabled', 'aria-expanded', 'aria-haspopup'],
      requiredParent: ['menu', 'menubar']
    });

    this.roles.set('alert', {
      name: 'alert',
      category: 'widget',
      requiredProperties: [],
      supportedProperties: ['aria-live', 'aria-atomic']
    });

    this.roles.set('dialog', {
      name: 'dialog',
      category: 'window',
      requiredProperties: [],
      supportedProperties: ['aria-modal', 'aria-label', 'aria-labelledby', 'aria-describedby']
    });

    this.roles.set('tablist', {
      name: 'tablist',
      category: 'widget',
      requiredProperties: [],
      supportedProperties: ['aria-orientation'],
      requiredChildren: ['tab']
    });

    this.roles.set('tab', {
      name: 'tab',
      category: 'widget',
      requiredProperties: [],
      supportedProperties: ['aria-selected', 'aria-controls'],
      requiredParent: ['tablist']
    });

    this.roles.set('tabpanel', {
      name: 'tabpanel',
      category: 'widget',
      requiredProperties: [],
      supportedProperties: ['aria-labelledby']
    });

    // Initialize ARIA properties
    this.properties = new Set([
      'aria-label',
      'aria-labelledby',
      'aria-describedby',
      'aria-controls',
      'aria-haspopup',
      'aria-expanded',
      'aria-hidden',
      'aria-invalid',
      'aria-required',
      'aria-readonly',
      'aria-disabled',
      'aria-checked',
      'aria-selected',
      'aria-pressed',
      'aria-level',
      'aria-valuemin',
      'aria-valuemax',
      'aria-valuenow',
      'aria-valuetext',
      'aria-orientation',
      'aria-live',
      'aria-atomic',
      'aria-relevant',
      'aria-busy',
      'aria-modal',
      'aria-activedescendant',
      'aria-owns',
      'aria-flowto',
      'aria-posinset',
      'aria-setsize',
      'aria-rowcount',
      'aria-colcount'
    ]);

    // Initialize ARIA states
    this.states = new Set([
      'aria-busy',
      'aria-checked',
      'aria-disabled',
      'aria-expanded',
      'aria-grabbed',
      'aria-hidden',
      'aria-invalid',
      'aria-pressed',
      'aria-selected'
    ]);
  }

  validate(html: string): ARIAValidationResult {
    const $ = cheerio.load(html);
    const issues: ARIAValidationIssue[] = [];
    const validUsages: string[] = [];
    const statistics = {
      totalARIAElements: 0,
      rolesUsed: new Set<string>(),
      propertiesUsed: new Set<string>(),
      statesUsed: new Set<string>()
    };

    // Validate role usage
    $('[role]').each((_: number, element: any) => {
      const $el = $(element);
      const role = $el.attr('role')!;
      statistics.rolesUsed.add(role);
      statistics.totalARIAElements++;

      if (!this.roles.has(role)) {
        issues.push({
          type: 'error',
          element: $el.prop('outerHTML')?.substring(0, 100) || '',
          selector: this.getSelector($el),
          message: `Invalid ARIA role: "${role}"`,
          recommendation: 'Use a valid ARIA role from the WAI-ARIA specification',
          specification: 'WAI-ARIA 1.2'
        });
      } else {
        const roleSpec = this.roles.get(role)!;
        
        // Check required properties
        roleSpec.requiredProperties.forEach((prop: string) => {
          if ($el.attr(prop) === undefined) {
            issues.push({
              type: 'error',
              element: $el.prop('outerHTML')?.substring(0, 100) || '',
              selector: this.getSelector($el),
              message: `Missing required property "${prop}" for role="${role}"`,
              recommendation: `Add ${prop} attribute to elements with role="${role}"`,
              specification: 'WAI-ARIA 1.2'
            });
          }
        });

        // Check parent requirements
        if (roleSpec.requiredParent) {
          const hasValidParent = roleSpec.requiredParent.some((parentRole: string) => 
            $el.closest(`[role="${parentRole}"]`).length > 0
          );
          
          if (!hasValidParent) {
            issues.push({
              type: 'error',
              element: $el.prop('outerHTML')?.substring(0, 100) || '',
              selector: this.getSelector($el),
              message: `Role "${role}" must be contained within one of: ${roleSpec.requiredParent.join(', ')}`,
              recommendation: `Place this element inside an element with role="${roleSpec.requiredParent[0]}"`,
              specification: 'WAI-ARIA 1.2'
            });
          }
        }
        
        validUsages.push(`Correct use of role="${role}" on ${this.getSelector($el)}`);
      }
    });

    // Validate ARIA properties and states
    this.properties.forEach(prop => {
      $(`[${prop}]`).each((_: number, element: any) => {
        const $el = $(element);
        statistics.propertiesUsed.add(prop);
        
        // Check for empty values
        const value = $el.attr(prop);
        if (value === '') {
          issues.push({
            type: 'warning',
            element: $el.prop('outerHTML')?.substring(0, 100) || '',
            selector: this.getSelector($el),
            message: `Empty value for ${prop}`,
            recommendation: `Provide a meaningful value for ${prop} or remove the attribute`,
            specification: 'WAI-ARIA 1.2'
          });
        }
        
        // Check aria-labelledby references
        if (prop === 'aria-labelledby' && value) {
          const ids = value.split(' ');
          ids.forEach((id: string) => {
            if ($(`#${id}`).length === 0) {
              issues.push({
                type: 'error',
                element: $el.prop('outerHTML')?.substring(0, 100) || '',
                selector: this.getSelector($el),
                message: `aria-labelledby references non-existent ID: "${id}"`,
                recommendation: `Ensure element with id="${id}" exists in the document`,
                specification: 'WAI-ARIA 1.2'
              });
            }
          });
        }
      });
    });

    // Check for redundant ARIA
    $('button[role="button"], nav[role="navigation"], main[role="main"], aside[role="complementary"]').each((_: number, element: any) => {
      const $el = $(element);
      issues.push({
        type: 'warning',
        element: $el.prop('outerHTML')?.substring(0, 100) || '',
        selector: this.getSelector($el),
        message: `Redundant ARIA role on ${element.tagName} element`,
        recommendation: 'Remove redundant role attribute as the element has implicit semantics',
        specification: 'WAI-ARIA 1.2'
      });
    });

    // Check for aria-hidden on focusable elements
    $('[aria-hidden="true"]').each((_: number, element: any) => {
      const $el = $(element);
      const focusableSelectors = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
      
      if ($el.is(focusableSelectors) || $el.find(focusableSelectors).length > 0) {
        issues.push({
          type: 'error',
          element: $el.prop('outerHTML')?.substring(0, 100) || '',
          selector: this.getSelector($el),
          message: 'aria-hidden="true" on focusable element or container with focusable children',
          recommendation: 'Remove aria-hidden or make element and children non-focusable',
          specification: 'WAI-ARIA 1.2'
        });
      }
    });

    // Check for proper landmark usage
    const landmarks = ['main', 'navigation', 'complementary', 'banner', 'contentinfo'];
    landmarks.forEach(landmark => {
      const count = $(`[role="${landmark}"]`).length;
      if (count > 1 && landmark === 'main') {
        issues.push({
          type: 'error',
          element: 'Multiple elements',
          selector: `[role="${landmark}"]`,
          message: 'Multiple main landmarks found',
          recommendation: 'Use only one main landmark per page',
          specification: 'WAI-ARIA 1.2'
        });
      } else if (count > 1) {
        const unlabeled = $(`[role="${landmark}"]`).filter((_: number, el: any) => 
          !$(el).attr('aria-label') && !$(el).attr('aria-labelledby')
        ).length;
        
        if (unlabeled > 0) {
          issues.push({
            type: 'warning',
            element: 'Multiple elements',
            selector: `[role="${landmark}"]`,
            message: `Multiple ${landmark} landmarks without unique labels`,
            recommendation: `Add aria-label or aria-labelledby to distinguish between ${landmark} landmarks`,
            specification: 'WAI-ARIA 1.2'
          });
        }
      }
    });

    // Enhance explanations for all issues
    const enhancedIssues = issues.map(issue => ARIAExplanationGenerator.enhanceIssue(issue));

    return { issues: enhancedIssues, validUsages, statistics };
  }

  private getSelector(element: cheerio.Cheerio<any>): string {
    const el = element.get(0);
    if (!el) return '';
    
    const id = element.attr('id');
    if (id) return `#${id}`;
    
    const role = element.attr('role');
    if (role) return `[role="${role}"]`;
    
    const classes = element.attr('class');
    if (classes) {
      const classList = classes.split(' ').filter((c: string) => c.trim());
      if (classList.length > 0) {
        return `${el.tagName}.${classList.join('.')}`;
      }
    }
    
    return el.tagName;
  }

  generateReport(result: ARIAValidationResult): string {
    const report: string[] = [];
    
    report.push('# ARIA Validation Report\n');
    report.push(`Total ARIA elements found: ${result.statistics.totalARIAElements}\n`);
    
    if (result.issues.length === 0) {
      report.push('✅ No ARIA validation issues found!\n');
    } else {
      report.push(`⚠️ Found ${result.issues.length} ARIA validation issues:\n`);
      
      const errors = result.issues.filter((i: ARIAValidationIssue) => i.type === 'error');
      const warnings = result.issues.filter((i: ARIAValidationIssue) => i.type === 'warning');
      
      if (errors.length > 0) {
        report.push(`\n## Errors (${errors.length})\n`);
        errors.forEach((issue: ARIAValidationIssue) => {
          report.push(`- **${issue.message}**`);
          report.push(`  - Element: ${issue.selector}`);
          report.push(`  - Recommendation: ${issue.recommendation}\n`);
        });
      }
      
      if (warnings.length > 0) {
        report.push(`\n## Warnings (${warnings.length})\n`);
        warnings.forEach((issue: ARIAValidationIssue) => {
          report.push(`- ${issue.message}`);
          report.push(`  - Element: ${issue.selector}`);
          report.push(`  - Recommendation: ${issue.recommendation}\n`);
        });
      }
    }
    
    report.push('\n## ARIA Usage Statistics\n');
    report.push(`- Roles used: ${Array.from(result.statistics.rolesUsed).join(', ')}`);
    report.push(`- Properties used: ${Array.from(result.statistics.propertiesUsed).join(', ')}`);
    
    return report.join('\n');
  }
} 