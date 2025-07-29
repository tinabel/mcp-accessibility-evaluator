#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AccessibilityEvaluator } from './accessibility-evaluator.js';
import { WCAGComplianceChecker } from './wcag-compliance-checker.js';
import { ARIAValidator } from './aria-validator.js';
import { DocumentationFetcher } from './documentation-fetcher.js';
import { ConfigLoader } from './config-loader.js';
import { AccessibilityIssue, EvaluationResult, ARIAValidationIssue, WCAGComplianceReport } from './types.js';

// Create server instance
const server = new Server({
  name: 'accessibility-evaluator',
  version: '1.0.0',
});

// Initialize components
const evaluator = new AccessibilityEvaluator();
const wcagChecker = new WCAGComplianceChecker();
const ariaValidator = new ARIAValidator();
const docFetcher = new DocumentationFetcher();
const configLoader = ConfigLoader.getInstance();

// Utility class for formatting results
class ResultFormatter {
  static formatEvaluationResult(result: EvaluationResult): string {
    const output: string[] = [];
    
    output.push('# 🔍 Accessibility Evaluation Report\n');
    
    // Summary
    output.push('## 📊 Summary');
    output.push(`- **Total Issues**: ${result.summary.totalIssues}`);
    output.push(`- **Errors**: ${result.summary.errors} | **Warnings**: ${result.summary.warnings} | **Info**: ${result.summary.info}`);
    
    if (Object.keys(result.summary.byStandard).length > 0) {
      output.push('- **By Standard**: ' + Object.entries(result.summary.byStandard)
        .map(([standard, count]) => `${standard}: ${count}`)
        .join(' | '));
    }
    
    if (Object.keys(result.summary.byImpact).length > 0) {
      output.push('- **By Impact**: ' + Object.entries(result.summary.byImpact)
        .map(([impact, count]) => `${impact}: ${count}`)
        .join(' | '));
    }
    
    output.push('');
    
    // Issues
    if (result.issues.length > 0) {
      const errors = result.issues.filter(i => i.type === 'error');
      const warnings = result.issues.filter(i => i.type === 'warning');
      const info = result.issues.filter(i => i.type === 'info');
      
      if (errors.length > 0) {
        output.push(`## ❌ Critical Issues (${errors.length})\n`);
        errors.forEach((issue: AccessibilityIssue, index: number) => {
          output.push(this.formatIssue(issue, index + 1));
        });
      }
      
      if (warnings.length > 0) {
        output.push(`## ⚠️ Warnings (${warnings.length})\n`);
        warnings.forEach((issue: AccessibilityIssue, index: number) => {
          output.push(this.formatIssue(issue, index + 1));
        });
      }
      
      if (info.length > 0) {
        output.push(`## ℹ️ Information (${info.length})\n`);
        info.forEach((issue: AccessibilityIssue, index: number) => {
          output.push(this.formatIssue(issue, index + 1));
        });
      }
    } else {
      output.push('## ✅ No Issues Found!');
      output.push('Great job! No accessibility issues were detected in the provided content.\n');
    }
    
    // Passed checks
    if (result.passedChecks.length > 0) {
      output.push('## ✅ Passed Checks');
      result.passedChecks.forEach(check => {
        output.push(`- ${check}`);
      });
      output.push('');
    }
    
    return output.join('\n');
  }
  
  private static formatIssue(issue: AccessibilityIssue, index: number): string {
    const output: string[] = [];
    
    const icon = issue.type === 'error' ? '🚫' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
    const impactIcon = issue.impact === 'critical' ? '🔴' : issue.impact === 'serious' ? '🟠' : issue.impact === 'moderate' ? '🟡' : '🟢';
    
    output.push(`### ${icon} Issue ${index}: ${issue.message}`);
    output.push(`**Standard**: ${issue.standard} | **Rule**: ${issue.rule} | **Impact**: ${impactIcon} ${issue.impact || 'unknown'}`);
    
    if (issue.element) {
      output.push(`**Element**: \`${issue.element.length > 100 ? issue.element.substring(0, 100) + '...' : issue.element}\``);
    }
    
    if (issue.selector) {
      output.push(`**Selector**: \`${issue.selector}\``);
    }
    
    if (issue.detailedExplanation) {
      output.push(`\n**📖 What this means**:`);
      output.push(issue.detailedExplanation);
    }
    
    if (issue.userImpact) {
      output.push(`\n**👥 User Impact**:`);
      output.push(issue.userImpact);
    }
    
    if (issue.why) {
      output.push(`\n**🤔 Why this matters**:`);
      output.push(issue.why);
    }
    
    if (issue.assistiveTechnologyImpact) {
      output.push(`\n**🔧 Assistive Technology Impact**:`);
      output.push(issue.assistiveTechnologyImpact);
    }
    
    if (issue.howToFix) {
      output.push(`\n**🛠️ How to Fix**:`);
      issue.howToFix.steps.forEach((step, i) => {
        output.push(`${i + 1}. ${step}`);
      });
      
      if (issue.howToFix.badExample && issue.howToFix.goodExample) {
        output.push(`\n**Examples**:`);
        output.push(`❌ **Bad**: \`${issue.howToFix.badExample}\``);
        output.push(`✅ **Good**: \`${issue.howToFix.goodExample}\``);
      }
      
      if (issue.howToFix.codeExample) {
        output.push(`\n**Code Example**:`);
        output.push('```html');
        output.push(issue.howToFix.codeExample);
        output.push('```');
      }
    }
    
    if (issue.relatedGuidelines && issue.relatedGuidelines.length > 0) {
      output.push(`\n**📋 Related Guidelines**: ${issue.relatedGuidelines.join(', ')}`);
    }
    
    if (issue.documentationLinks && issue.documentationLinks.length > 0) {
      output.push(`\n**📚 Learn More**:`);
      issue.documentationLinks.forEach(link => {
        output.push(`- ${link}`);
      });
    }
    
    output.push('\n---\n');
    
    return output.join('\n');
  }
  
  static formatARIAReport(issues: ARIAValidationIssue[], validUsages: string[], statistics: any): string {
    const output: string[] = [];
    
    output.push('# 🎭 ARIA Validation Report\n');
    
    output.push('## 📊 Statistics');
    output.push(`- **Total ARIA elements**: ${statistics.totalARIAElements}`);
    output.push(`- **Roles used**: ${Array.from(statistics.rolesUsed).join(', ') || 'None'}`);
    output.push(`- **Properties used**: ${Array.from(statistics.propertiesUsed).join(', ') || 'None'}`);
    output.push('');
    
    if (issues.length === 0) {
      output.push('## ✅ No ARIA Issues Found!');
      output.push('Excellent! All ARIA usage follows the specification correctly.\n');
    } else {
      const errors = issues.filter(i => i.type === 'error');
      const warnings = issues.filter(i => i.type === 'warning');
      
      if (errors.length > 0) {
        output.push(`## ❌ ARIA Errors (${errors.length})\n`);
        errors.forEach((issue: ARIAValidationIssue, index: number) => {
          output.push(this.formatARIAIssue(issue, index + 1));
        });
      }
      
      if (warnings.length > 0) {
        output.push(`## ⚠️ ARIA Warnings (${warnings.length})\n`);
        warnings.forEach((issue: ARIAValidationIssue, index: number) => {
          output.push(this.formatARIAIssue(issue, index + 1));
        });
      }
    }
    
    if (validUsages.length > 0) {
      output.push('## ✅ Correct ARIA Usage');
      validUsages.forEach(usage => {
        output.push(`- ${usage}`);
      });
      output.push('');
    }
    
    return output.join('\n');
  }
  
  private static formatARIAIssue(issue: ARIAValidationIssue, index: number): string {
    const output: string[] = [];
    
    const icon = issue.type === 'error' ? '🚫' : '⚠️';
    
    output.push(`### ${icon} ARIA Issue ${index}: ${issue.message}`);
    output.push(`**Element**: \`${issue.selector}\` | **Specification**: ${issue.specification}`);
    
    if (issue.detailedExplanation) {
      output.push(`\n**📖 What this means**:`);
      output.push(issue.detailedExplanation);
    }
    
    if (issue.userImpact) {
      output.push(`\n**👥 User Impact**:`);
      output.push(issue.userImpact);
    }
    
    if (issue.why) {
      output.push(`\n**🤔 Why this matters**:`);
      output.push(issue.why);
    }
    
    if (issue.assistiveTechnologyImpact) {
      output.push(`\n**🔧 Assistive Technology Impact**:`);
      output.push(issue.assistiveTechnologyImpact);
    }
    
    if (issue.howToFix) {
      output.push(`\n**🛠️ How to Fix**:`);
      issue.howToFix.steps.forEach((step, i) => {
        output.push(`${i + 1}. ${step}`);
      });
      
      if (issue.howToFix.badExample && issue.howToFix.goodExample) {
        output.push(`\n**Examples**:`);
        output.push(`❌ **Bad**: \`${issue.howToFix.badExample}\``);
        output.push(`✅ **Good**: \`${issue.howToFix.goodExample}\``);
      }
      
      if (issue.howToFix.codeExample) {
        output.push(`\n**Code Example**:`);
        output.push('```html');
        output.push(issue.howToFix.codeExample);
        output.push('```');
      }
    }
    
    output.push(`\n**💡 Recommendation**: ${issue.recommendation}`);
    
    if (issue.relatedGuidelines && issue.relatedGuidelines.length > 0) {
      output.push(`\n**📋 Related Guidelines**: ${issue.relatedGuidelines.join(', ')}`);
    }
    
    if (issue.documentationLinks && issue.documentationLinks.length > 0) {
      output.push(`\n**📚 Learn More**:`);
      issue.documentationLinks.forEach(link => {
        output.push(`- ${link}`);
      });
    }
    
    output.push('\n---\n');
    
    return output.join('\n');
  }

  static formatWCAGComplianceReport(report: WCAGComplianceReport): string {
    const output: string[] = [];
    
    output.push('# 📋 WCAG Compliance Report\n');
    
    output.push('## 🎯 Compliance Summary');
    output.push(`- **Compliance Level**: ${report.level}`);
    output.push(`- **Overall Score**: ${report.overallScore}%`);
    output.push(`- **Target Level**: ${report.targetLevel}`);
    output.push(`- **Meets Target**: ${report.meetsTarget ? '✅ Yes' : '❌ No'}`);
    output.push('');
    
    output.push('## 📈 Detailed Scores by Principle');
    output.push(`- **Perceivable**: ${report.detailedScores.perceivable}%`);
    output.push(`- **Operable**: ${report.detailedScores.operable}%`);
    output.push(`- **Understandable**: ${report.detailedScores.understandable}%`);
    output.push(`- **Robust**: ${report.detailedScores.robust}%`);
    output.push('');
    
    if (report.passedCriteria.length > 0) {
      output.push(`## ✅ Passed Criteria (${report.passedCriteria.length})`);
      report.passedCriteria.forEach((criterion) => {
        output.push(`- **${criterion.id}** ${criterion.name} (Level ${criterion.level})`);
      });
      output.push('');
    }
    
    if (report.failedCriteria.length > 0) {
      output.push(`## ❌ Failed Criteria (${report.failedCriteria.length})`);
      report.failedCriteria.forEach((criterion) => {
        output.push(`- **${criterion.id}** ${criterion.name} (Level ${criterion.level}) - ${criterion.principle}`);
      });
      output.push('');
    }
    
    if (report.recommendations && report.recommendations.length > 0) {
      output.push('## 💡 Detailed Recommendations\n');
      report.recommendations.forEach((recommendation: string) => {
        output.push(recommendation);
        output.push('\n---\n');
      });
    }
    
    if (report.notApplicableCriteria.length > 0) {
      output.push(`## ➖ Not Applicable Criteria (${report.notApplicableCriteria.length})`);
      report.notApplicableCriteria.forEach((criterion) => {
        output.push(`- **${criterion.id}** ${criterion.name} (Level ${criterion.level})`);
      });
      output.push('');
    }
    
    return output.join('\n');
  }
}

// Define available tools
const tools: any[] = [
  {
    name: 'evaluate_accessibility',
    description: 'Evaluate the accessibility of HTML content against WCAG, ARIA, and best practices',
    inputSchema: {
      type: 'object',
      properties: {
        html: {
          type: 'string',
          description: 'The HTML content to evaluate',
        },
        url: {
          type: 'string',
          description: 'URL to fetch and evaluate (alternative to providing HTML directly)',
        },
      },
    },
  },
  {
    name: 'check_wcag_compliance',
    description: 'Check WCAG 2.1 compliance level and get detailed report',
    inputSchema: {
      type: 'object',
      properties: {
        html: {
          type: 'string',
          description: 'The HTML content to check for WCAG compliance',
        },
        url: {
          type: 'string',
          description: 'URL to fetch and check for WCAG compliance',
        },
        targetLevel: {
          type: 'string',
          enum: ['A', 'AA', 'AAA'],
          description: 'Target WCAG compliance level',
          default: 'AA',
        },
      },
    },
  },
  {
    name: 'validate_aria',
    description: 'Validate ARIA usage and get recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        html: {
          type: 'string',
          description: 'The HTML content to validate ARIA usage',
        },
        url: {
          type: 'string',
          description: 'URL to fetch and validate ARIA usage',
        },
      },
    },
  },
  {
    name: 'fetch_accessibility_docs',
    description: 'Fetch and cache accessibility documentation from W3C and MDN',
    inputSchema: {
      type: 'object',
      properties: {
        sources: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['wcag', 'aria', 'mdn', 'all'],
          },
          description: 'Which documentation sources to fetch',
          default: ['all'],
        },
      },
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'evaluate_accessibility': {
        let html: string;
        
        if (args.url) {
          const response = await fetch(args.url);
          html = await response.text();
        } else {
          html = args.html;
        }
        
        const result = await evaluator.evaluateHTML(html);
        
        return {
          content: [
            {
              type: 'text',
              text: ResultFormatter.formatEvaluationResult(result),
            },
          ],
        };
      }

      case 'check_wcag_compliance': {
        let html: string;
        
        if (args.url) {
          const response = await fetch(args.url);
          html = await response.text();
        } else {
          html = args.html;
        }
        
        // First run the general evaluation
        const evaluationResult = await evaluator.evaluateHTML(html);
        
        // Then check WCAG compliance with target level
        const config = await configLoader.getConfig();
        const targetLevel = configLoader.getWCAGLevel(args.targetLevel);
        const complianceReport = wcagChecker.evaluateCompliance(evaluationResult, targetLevel);
        
        // Generate recommendations for failed criteria
        const recommendations = wcagChecker.generateRecommendations(complianceReport.failedCriteria);
        
        const report = {
          ...complianceReport,
          recommendations,
          targetLevel: args.targetLevel || 'AA',
          meetsTarget: complianceReport.level >= (args.targetLevel || 'AA'),
        };
        
        return {
          content: [
            {
              type: 'text',
              text: ResultFormatter.formatWCAGComplianceReport(report),
            },
          ],
        };
      }

      case 'validate_aria': {
        let html: string;
        
        if (args.url) {
          const response = await fetch(args.url);
          html = await response.text();
        } else {
          html = args.html;
        }
        
        const result = ariaValidator.validate(html);
        const formattedReport = ResultFormatter.formatARIAReport(result.issues, result.validUsages, result.statistics);
        
        return {
          content: [
            {
              type: 'text',
              text: formattedReport,
            },
          ],
        };
      }

      case 'fetch_accessibility_docs': {
        await docFetcher.initialize();
        
        const sources = args.sources || ['all'];
        const results: Record<string, any> = {};
        
        if (sources.includes('all') || sources.includes('wcag')) {
          results.wcag = await docFetcher.fetchWCAGGuidelines();
        }
        
        if (sources.includes('all') || sources.includes('aria')) {
          results.aria = await docFetcher.fetchARIADocumentation();
        }
        
        if (sources.includes('all') || sources.includes('mdn')) {
          results.mdn = await docFetcher.fetchMDNAccessibilityGuides();
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Successfully fetched documentation: ${Object.keys(results).join(', ')}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error('Tool execution error:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
      error: {
        message: error instanceof Error ? error.message : String(error),
        code: 'TOOL_EXECUTION_ERROR'
      }
    };
  }
});

// Start the server
async function main() {
  try {
    // Set up error handlers to prevent crashing
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      // Exit gracefully to prevent hanging
      process.exit(1);
    });

    process.on('unhandledRejection', (error) => {
      console.error('Unhandled rejection:', error);
      // Exit gracefully to prevent hanging
      process.exit(1);
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Accessibility Evaluator server running on stdio');
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal server error:', error);
  process.exit(1);
}); 