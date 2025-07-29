import * as cheerio from "cheerio";
import axe from "axe-core";
import { JSDOM } from "jsdom";
import { AccessibilityIssue, EvaluationResult, Explanation } from "./types.js";
import { explanations } from "./constants.js";

export class ExplanationGenerator {
  static enhanceIssue(issue: AccessibilityIssue): AccessibilityIssue {
    const explanationMap = explanations.issues.rules;
    const explanation: Explanation = explanationMap[
      issue.rule as keyof typeof explanationMap
    ]
      ? explanationMap[issue.rule as keyof typeof explanationMap]
      : (explanationMap["default"] as Explanation);
    const enhancedIssue = { ...issue, ...explanation };
    return enhancedIssue;
  }
}

export class AccessibilityEvaluator {
  private wcagRules: Map<string, any>;
  private ariaRules: Map<string, any>;

  constructor() {
    this.wcagRules = new Map();
    this.ariaRules = new Map();
    this.initializeRules();
  }

  private initializeRules(): void {
    // Initialize WCAG 2.1 rules
    this.wcagRules.set("images-alt-text", {
      check: ($: cheerio.CheerioAPI) => {
        const issues: AccessibilityIssue[] = [];
        $("img").each((_: number, element: any) => {
          const $el = $(element);
          const alt = $el.attr("alt");

          if (
            alt === undefined &&
            !$el.attr("role")?.includes("presentation")
          ) {
            issues.push({
              type: "error",
              rule: "WCAG 1.1.1",
              message: "Images must have alternative text",
              element: $el.prop("outerHTML")?.substring(0, 100),
              selector: this.getSelector($el),
              standard: "WCAG",
              level: "A",
              impact: "critical",
            });
          }
        });
        return issues;
      },
    });

    this.wcagRules.set("headings-structure", {
      check: ($: cheerio.CheerioAPI) => {
        const issues: AccessibilityIssue[] = [];
        let lastLevel = 0;

        $("h1, h2, h3, h4, h5, h6").each((_: number, element: any) => {
          const $el = $(element);
          const level = parseInt(element.tagName.charAt(1));

          if (lastLevel !== 0 && level > lastLevel + 1) {
            issues.push({
              type: "warning",
              rule: "WCAG 1.3.1",
              message: `Heading levels should not skip (found h${level} after h${lastLevel})`,
              element: $el.text().substring(0, 50),
              selector: this.getSelector($el),
              standard: "WCAG",
              level: "A",
              impact: "moderate",
            });
          }
          lastLevel = level;
        });

        return issues;
      },
    });

    this.wcagRules.set("form-labels", {
      check: ($: cheerio.CheerioAPI) => {
        const issues: AccessibilityIssue[] = [];

        $("input, select, textarea").each((_: number, element: any) => {
          const $el = $(element);
          const type = $el.attr("type");

          // Skip buttons and hidden inputs
          if (type === "submit" || type === "button" || type === "hidden") {
            return;
          }

          const id = $el.attr("id");
          const ariaLabel = $el.attr("aria-label");
          const ariaLabelledby = $el.attr("aria-labelledby");

          // Check for associated label
          let hasLabel = false;
          if (id) {
            hasLabel = $(`label[for="${id}"]`).length > 0;
          }

          if (!hasLabel && !ariaLabel && !ariaLabelledby) {
            issues.push({
              type: "error",
              rule: "WCAG 1.3.1",
              message: "Form controls must have associated labels",
              element: $el.prop("outerHTML")?.substring(0, 100),
              selector: this.getSelector($el),
              standard: "WCAG",
              level: "A",
              impact: "critical",
            });
          }
        });

        return issues;
      },
    });

    // Initialize ARIA rules
    this.ariaRules.set("aria-required-attr", {
      check: ($: cheerio.CheerioAPI) => {
        const issues: AccessibilityIssue[] = [];
        const requiredAttributes: Record<string, string[]> = {
          checkbox: ["aria-checked"],
          combobox: ["aria-expanded"],
          scrollbar: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
          slider: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
        };

        $("[role]").each((_: number, element: any) => {
          const $el = $(element);
          const role = $el.attr("role");

          if (role && requiredAttributes[role]) {
            requiredAttributes[role].forEach((attr) => {
              if ($el.attr(attr) === undefined) {
                issues.push({
                  type: "error",
                  rule: "ARIA Required Attributes",
                  message: `Elements with role="${role}" must have ${attr} attribute`,
                  element: $el.prop("outerHTML")?.substring(0, 100),
                  selector: this.getSelector($el),
                  standard: "ARIA",
                  impact: "serious",
                });
              }
            });
          }
        });

        return issues;
      },
    });

    this.ariaRules.set("aria-valid-values", {
      check: ($: cheerio.CheerioAPI) => {
        const issues: AccessibilityIssue[] = [];
        const validValues: Record<string, string[]> = {
          "aria-checked": ["true", "false", "mixed"],
          "aria-disabled": ["true", "false"],
          "aria-expanded": ["true", "false"],
          "aria-hidden": ["true", "false"],
          "aria-invalid": ["true", "false", "grammar", "spelling"],
        };

        Object.keys(validValues).forEach((attr) => {
          $(`[${attr}]`).each((_: number, element: any) => {
            const $el = $(element);
            const value = $el.attr(attr);

            if (value && !validValues[attr].includes(value)) {
              issues.push({
                type: "error",
                rule: "ARIA Valid Values",
                message: `Invalid value for ${attr}: "${value}". Valid values are: ${validValues[attr].join(", ")}`,
                element: $el.prop("outerHTML")?.substring(0, 100),
                selector: this.getSelector($el),
                standard: "ARIA",
                impact: "serious",
              });
            }
          });
        });

        return issues;
      },
    });
  }

  private getSelector(element: cheerio.Cheerio): string {
    const el = element.get(0);
    if (!el) return "";

    const id = element.attr("id");
    if (id) return `#${id}`;

    const classes = element.attr("class");
    if (classes) {
      const classList = classes.split(" ").filter((c: string) => c.trim());
      if (classList.length > 0) {
        return `${el.tagName}.${classList.join(".")}`;
      }
    }

    return el.tagName;
  }

  async evaluateHTML(html: string): Promise<EvaluationResult> {
    const $ = cheerio.load(html);
    const issues: AccessibilityIssue[] = [];
    const passedChecks: string[] = [];

    // Run WCAG checks
    for (const [ruleName, rule] of this.wcagRules) {
      const ruleIssues = rule.check($);
      if (ruleIssues.length === 0) {
        passedChecks.push(`WCAG: ${ruleName}`);
      } else {
        issues.push(...ruleIssues);
      }
    }

    // Run ARIA checks
    for (const [ruleName, rule] of this.ariaRules) {
      const ruleIssues = rule.check($);
      if (ruleIssues.length === 0) {
        passedChecks.push(`ARIA: ${ruleName}`);
      } else {
        issues.push(...ruleIssues);
      }
    }

    // Run axe-core checks
    try {
      const axeResults = await this.runAxeCore(html);
      issues.push(...axeResults);
    } catch (error) {
      console.error("Failed to run axe-core:", error);
    }

    // Enhance explanations for all issues
    const enhancedIssues = issues.map((issue) =>
      ExplanationGenerator.enhanceIssue(issue)
    );

    // Calculate summary
    const summary = {
      totalIssues: enhancedIssues.length,
      errors: enhancedIssues.filter((i) => i.type === "error").length,
      warnings: enhancedIssues.filter((i) => i.type === "warning").length,
      info: enhancedIssues.filter((i) => i.type === "info").length,
      byStandard: {} as Record<string, number>,
      byImpact: {} as Record<string, number>,
    };

    // Count by standard
    enhancedIssues.forEach((issue) => {
      summary.byStandard[issue.standard] =
        (summary.byStandard[issue.standard] || 0) + 1;
      if (issue.impact) {
        summary.byImpact[issue.impact] =
          (summary.byImpact[issue.impact] || 0) + 1;
      }
    });

    return { issues: enhancedIssues, summary, passedChecks };
  }

  private async runAxeCore(html: string): Promise<AccessibilityIssue[]> {
    const dom = new JSDOM(html);
    const window = dom.window as any;
    const document = window.document;

    // Configure axe-core
    const axeConfig = {
      rules: {
        "color-contrast": { enabled: true },
        "document-title": { enabled: true },
        "html-has-lang": { enabled: true },
        "meta-viewport": { enabled: true },
        "valid-lang": { enabled: true },
        "page-has-heading-one": { enabled: true },
      },
    };

    try {
      // Run axe-core analysis
      const results = await axe.run(document, axeConfig);
      return results.violations.map((violation) => ({
        type: "error",
        rule: violation.id,
        message: violation.description,
        element: violation.nodes[0].html,
        selector: violation.nodes[0].target.join(" "),
        standard: "AXE",
        impact: violation.nodes[0].impact as any,
      }));
    } catch (error) {
      console.error("Error running axe-core:", error);
      return [];
    }
  }

  async evaluateURL(url: string): Promise<EvaluationResult> {
    // Fetch the HTML content
    const response = await fetch(url);
    const html = await response.text();
    return this.evaluateHTML(html);
  }
}
