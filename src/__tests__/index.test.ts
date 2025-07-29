import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// Mock the SDK modules
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

// Mock the internal modules
jest.mock('../documentation-fetcher.js');
jest.mock('../accessibility-evaluator.js');
jest.mock('../wcag-compliance-checker.js');
jest.mock('../aria-validator.js');

describe('MCP Accessibility Evaluator Server', () => {
  let mockServer: jest.Mocked<Server>;
  let listToolsHandler: Function;
  let callToolHandler: Function;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock server
    mockServer = {
      setRequestHandler: jest.fn((schema, handler) => {
        if (schema.type === 'list_tools') {
          listToolsHandler = handler;
        } else if (schema.type === 'call_tool') {
          callToolHandler = handler;
        }
      }),
      connect: jest.fn()
    } as any;

    (Server as jest.MockedClass<typeof Server>).mockImplementation(() => mockServer);
  });

  describe('Tool Registration', () => {
    it('should register all tools correctly', async () => {
      // Import the server module to trigger initialization
      require('../index');

      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(2);
      
      // Test list tools handler
      const tools = await listToolsHandler();
      expect(tools.tools).toHaveLength(4);
      
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).toContain('evaluate_accessibility');
      expect(toolNames).toContain('check_wcag_compliance');
      expect(toolNames).toContain('validate_aria');
      expect(toolNames).toContain('fetch_accessibility_docs');
    });
  });

  describe('Tool Execution', () => {
    beforeEach(() => {
      require('../index');
    });

    it('should handle evaluate_accessibility with HTML input', async () => {
      const mockEvaluator = require('../accessibility-evaluator').AccessibilityEvaluator;
      mockEvaluator.prototype.evaluateHTML = jest.fn().mockResolvedValue({
        issues: [{ type: 'error', message: 'Test issue' }],
        summary: { totalIssues: 1 },
        passedChecks: []
      });

      const result = await callToolHandler({
        params: {
          name: 'evaluate_accessibility',
          arguments: { html: '<html><body></body></html>' }
        }
      });

      expect(mockEvaluator.prototype.evaluateHTML).toHaveBeenCalledWith('<html><body></body></html>');
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Test issue');
    });

    it('should handle evaluate_accessibility with URL input', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        text: jest.fn().mockResolvedValue('<html><body>Test</body></html>')
      });

      const mockEvaluator = require('../accessibility-evaluator').AccessibilityEvaluator;
      mockEvaluator.prototype.evaluateHTML = jest.fn().mockResolvedValue({
        issues: [],
        summary: { totalIssues: 0 },
        passedChecks: ['test']
      });

      const result = await callToolHandler({
        params: {
          name: 'evaluate_accessibility',
          arguments: { url: 'https://example.com' }
        }
      });

      expect(global.fetch).toHaveBeenCalledWith('https://example.com');
      expect(mockEvaluator.prototype.evaluateHTML).toHaveBeenCalled();
    });

    it('should handle check_wcag_compliance', async () => {
      const mockEvaluator = require('../accessibility-evaluator').AccessibilityEvaluator;
      const mockChecker = require('../wcag-compliance-checker').WCAGComplianceChecker;
      
      mockEvaluator.prototype.evaluateHTML = jest.fn().mockResolvedValue({
        issues: [],
        summary: { totalIssues: 0 },
        passedChecks: []
      });

      mockChecker.prototype.evaluateCompliance = jest.fn().mockResolvedValue({
        level: 'AA',
        failedCriteria: [],
        passedCriteria: [],
        notApplicableCriteria: []
      });

      mockChecker.prototype.generateRecommendations = jest.fn().mockReturnValue([]);

      const result = await callToolHandler({
        params: {
          name: 'check_wcag_compliance',
          arguments: { 
            html: '<html><body></body></html>',
            targetLevel: 'AA'
          }
        }
      });

      expect(mockChecker.prototype.evaluateCompliance).toHaveBeenCalled();
      expect(result.content[0].text).toContain('AA');
      expect(result.content[0].text).toContain('meetsTarget');
    });

    it('should handle validate_aria', async () => {
      const mockValidator = require('../aria-validator').ARIAValidator;
      
      mockValidator.prototype.validate = jest.fn().mockReturnValue({
        issues: [],
        validUsages: [],
        statistics: {
          totalARIAElements: 0,
          rolesUsed: new Set(),
          propertiesUsed: new Set(),
          statesUsed: new Set()
        }
      });

      mockValidator.prototype.generateReport = jest.fn().mockReturnValue('Test Report');

      const result = await callToolHandler({
        params: {
          name: 'validate_aria',
          arguments: { html: '<html><body></body></html>' }
        }
      });

      expect(mockValidator.prototype.validate).toHaveBeenCalled();
      expect(mockValidator.prototype.generateReport).toHaveBeenCalled();
      expect(result.content[0].text).toBe('Test Report');
    });

    it('should handle fetch_accessibility_docs', async () => {
      const mockFetcher = require('../documentation-fetcher').DocumentationFetcher;
      
      mockFetcher.prototype.initialize = jest.fn().mockResolvedValue(undefined);
      mockFetcher.prototype.fetchWCAGGuidelines = jest.fn().mockResolvedValue(new Map());
      mockFetcher.prototype.fetchARIADocumentation = jest.fn().mockResolvedValue(new Map());
      mockFetcher.prototype.fetchMDNAccessibilityGuides = jest.fn().mockResolvedValue(new Map());

      const result = await callToolHandler({
        params: {
          name: 'fetch_accessibility_docs',
          arguments: { sources: ['all'] }
        }
      });

      expect(mockFetcher.prototype.initialize).toHaveBeenCalled();
      expect(mockFetcher.prototype.fetchWCAGGuidelines).toHaveBeenCalled();
      expect(mockFetcher.prototype.fetchARIADocumentation).toHaveBeenCalled();
      expect(mockFetcher.prototype.fetchMDNAccessibilityGuides).toHaveBeenCalled();
      expect(result.content[0].text).toContain('Successfully fetched');
    });

    it('should handle unknown tool error', async () => {
      const result = await callToolHandler({
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool: unknown_tool');
    });

    it('should handle tool execution errors gracefully', async () => {
      const mockEvaluator = require('../accessibility-evaluator').AccessibilityEvaluator;
      mockEvaluator.prototype.evaluateHTML = jest.fn().mockRejectedValue(new Error('Test error'));

      const result = await callToolHandler({
        params: {
          name: 'evaluate_accessibility',
          arguments: { html: '<html><body></body></html>' }
        }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error: Test error');
    });
  });
}); 