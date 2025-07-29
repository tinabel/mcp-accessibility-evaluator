# Testing Guide for MCP Accessibility Evaluator

## Overview

This project uses Jest as its testing framework with TypeScript support. The test suite includes unit tests for individual modules and integration tests for the MCP server.

## Test Structure

```
src/__tests__/
├── accessibility-evaluator.test.ts   # Core evaluation engine tests
├── aria-validator.test.ts           # ARIA validation tests  
├── documentation-fetcher.test.ts    # Documentation fetching tests
├── example-custom-rule.test.ts      # Example of testing custom rules
├── index.test.ts                    # MCP server integration tests
├── setup.ts                         # Test setup and globals
└── wcag-compliance-checker.test.ts  # WCAG compliance tests
```

## Running Tests

### Prerequisites

First, install dependencies:

```bash
npm install
```

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Use the convenience script
./run-tests.sh
./run-tests.sh --coverage
```

### Running Specific Tests

```bash
# Run a single test file
npx jest accessibility-evaluator.test.ts

# Run tests matching a pattern
npx jest --testNamePattern="ARIA"

# Run tests for a specific module
npx jest --testPathPattern="aria-validator"

# Debug tests
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Test Coverage

The project is configured to maintain 80% code coverage across:
- Branches
- Functions  
- Lines
- Statements

Coverage reports are generated in the `coverage/` directory and include:
- HTML reports (open `coverage/lcov-report/index.html`)
- JSON summary (`coverage/coverage-final.json`)
- LCOV format for CI integration

## Writing Tests

### Basic Test Structure

```typescript
import { MyModule } from '../my-module';

describe('MyModule', () => {
  let instance: MyModule;

  beforeEach(() => {
    instance = new MyModule();
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = instance.methodName(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Testing Async Code

```typescript
it('should handle async operations', async () => {
  const result = await instance.asyncMethod();
  expect(result).toBeDefined();
});
```

### Mocking Dependencies

```typescript
// Mock external modules
jest.mock('node-fetch');
import fetch from 'node-fetch';

// Mock internal modules
jest.mock('../my-dependency');

// Use mocked functions
(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
  ok: true,
  text: jest.fn().mockResolvedValue('response')
} as any);
```

## Test Categories

### 1. Unit Tests

Each module has comprehensive unit tests covering:

- **Accessibility Evaluator**: Tests WCAG rules, ARIA validation, issue detection
- **ARIA Validator**: Tests role validation, property checks, parent-child relationships
- **WCAG Compliance Checker**: Tests compliance level calculation, scoring, recommendations
- **Documentation Fetcher**: Tests caching, HTTP fetching, content extraction

### 2. Integration Tests

The `index.test.ts` file tests:
- MCP server initialization
- Tool registration
- Request handling
- Error handling
- End-to-end tool execution

### 3. Example Tests

The `example-custom-rule.test.ts` demonstrates:
- How to write tests for custom accessibility rules
- Extending the evaluator with new rules
- Testing complex scenarios

## Common Testing Patterns

### Testing HTML Evaluation

```typescript
it('should detect accessibility issues', async () => {
  const html = `
    <html>
      <body>
        <img src="test.jpg">
      </body>
    </html>
  `;
  
  const result = await evaluator.evaluateHTML(html);
  
  expect(result.issues).toContainEqual(
    expect.objectContaining({
      type: 'error',
      rule: 'WCAG 1.1.1',
      message: 'Images must have alternative text'
    })
  );
});
```

### Testing with Cheerio

```typescript
const $ = cheerio.load(html);
const issues = validator.checkSomething($);
expect(issues).toHaveLength(1);
```

### Testing Error Handling

```typescript
it('should handle errors gracefully', async () => {
  mockFunction.mockRejectedValue(new Error('Test error'));
  
  await expect(instance.method())
    .rejects.toThrow('Test error');
});
```

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main`

The GitHub Actions workflow:
1. Tests on Node.js 18.x and 20.x
2. Runs type checking
3. Executes full test suite
4. Generates coverage reports
5. Uploads coverage to Codecov (optional)

## Debugging Tests

### VS Code Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache", "${file}"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Command Line Debugging

```bash
# Debug all tests
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand accessibility-evaluator.test.ts
```

## Troubleshooting

### Common Issues

1. **TypeScript errors about Jest types**
   - Run `npm install` to install `@types/jest`
   - Ensure `tsconfig.json` includes `"types": ["node", "jest"]`

2. **Module not found errors**
   - Check import paths use correct extensions
   - Ensure all dependencies are installed

3. **Tests timing out**
   - Increase timeout: `jest.setTimeout(10000)`
   - Check for unresolved promises

4. **Coverage not meeting thresholds**
   - Add more test cases
   - Check for untested error paths
   - Exclude files appropriately in jest.config.js

## Best Practices

1. **Test Organization**
   - Group related tests with `describe` blocks
   - Use descriptive test names
   - Follow AAA pattern: Arrange, Act, Assert

2. **Mocking**
   - Mock external dependencies
   - Clear mocks between tests
   - Verify mock calls when appropriate

3. **Assertions**
   - Use specific matchers (`toBe`, `toEqual`, `toContain`)
   - Test both success and failure cases
   - Verify edge cases

4. **Performance**
   - Keep tests fast and focused
   - Use `beforeEach` for common setup
   - Avoid testing implementation details 