# WCAG Levels Configuration Guide

This guide explains how to configure and use different WCAG compliance levels (A, AA, AAA) with the MCP Accessibility Evaluator.

## Overview

The WCAG (Web Content Accessibility Guidelines) defines three levels of conformance:

- **Level A**: The minimum level of conformance
- **Level AA**: The standard level of conformance (recommended for most websites)
- **Level AAA**: The highest level of conformance

## How to Use Different WCAG Levels

### Using the MCP Tool

The `check_wcag_compliance` tool accepts a `targetLevel` parameter:

```json
{
  "name": "check_wcag_compliance",
  "arguments": {
    "html": "<your HTML content>",
    "targetLevel": "A"  // or "AA" or "AAA"
  }
}
```

### Target Level Options

#### Level A (Minimum)

- Only checks for Level A success criteria
- Focuses on the most critical accessibility barriers
- Example criteria:
  - 1.1.1 Non-text Content (alt text for images)
  - 1.3.1 Info and Relationships (proper heading structure)
  - 2.1.1 Keyboard accessibility

```json
{
  "targetLevel": "A"
}
```

#### Level AA (Standard - Default)

- Checks for Level A AND Level AA success criteria
- Recommended for most websites and legal compliance
- Includes additional criteria like:
  - 1.4.3 Contrast (Minimum) - 4.5:1 contrast ratio
  - 2.4.6 Headings and Labels
  - 3.3.3 Error Suggestion

```json
{
  "targetLevel": "AA"
}
```

#### Level AAA (Highest)

- Checks for Level A, AA, AND AAA success criteria
- The most stringent level, not required for general compliance
- Includes enhanced criteria like:
  - 1.4.6 Contrast (Enhanced) - 7:1 contrast ratio
  - 2.4.9 Link Purpose (Link Only)
  - 3.1.5 Reading Level

```json
{
  "targetLevel": "AAA"
}
```

## Example Usage

### Testing for Level A Only

```javascript
// For testing basic accessibility requirements
const result = await mcp.callTool('check_wcag_compliance', {
  html: myHTML,
  targetLevel: 'A'
});
```

This will:

- Only evaluate Level A criteria
- Report compliance as "A", "None" (no intermediate levels)
- Focus on fundamental accessibility barriers

### Testing for Level AA (Recommended)

```javascript
// For standard web accessibility compliance
const result = await mcp.callTool('check_wcag_compliance', {
  html: myHTML,
  targetLevel: 'AA'  // This is the default
});
```

This will:

- Evaluate Level A AND Level AA criteria
- Report compliance as "A", "AA", or "None"
- Cover most legal accessibility requirements

### Testing for Level AAA

```javascript
// For enhanced accessibility compliance
const result = await mcp.callTool('check_wcag_compliance', {
  html: myHTML,
  targetLevel: 'AAA'
});
```

This will:

- Evaluate ALL criteria (A, AA, and AAA)
- Report compliance as "A", "AA", "AAA", or "None"
- Provide the most comprehensive accessibility evaluation

## Understanding the Results

### Compliance Level

The tool reports the highest level of compliance achieved:

- **"None"**: Failed Level A criteria (critical accessibility barriers)
- **"A"**: Passed all Level A criteria, but failed some Level AA criteria
- **"AA"**: Passed all Level A and AA criteria, but failed some Level AAA criteria
- **"AAA"**: Passed all applicable criteria up to Level AAA

### Target vs. Achieved Level

The report includes:

- `targetLevel`: The level you requested to test against
- `level`: The actual level of compliance achieved
- `meetsTarget`: Whether the content meets your target level

### Example Report Interpretation

```json
{
  "targetLevel": "AA",
  "level": "A",
  "meetsTarget": false,
  "overallScore": 75
}
```

This means:

- You tested for Level AA compliance
- The content only achieves Level A compliance
- There are Level AA failures preventing full AA compliance
- 75% of all applicable criteria passed

## Practical Use Cases

### 1. Progressive Enhancement

Start with Level A, then work towards AA:

```javascript
// Step 1: Ensure basic accessibility
await checkWCAG(html, 'A');

// Step 2: Once Level A passes, aim for AA
await checkWCAG(html, 'AA');
```

### 2. Legal Compliance Checking

Most jurisdictions require Level AA:

```javascript
const result = await checkWCAG(html, 'AA');
if (result.meetsTarget) {
  console.log('Meets legal accessibility requirements');
}
```

### 3. Enhanced Accessibility

For organizations committed to maximum accessibility:

```javascript
const result = await checkWCAG(html, 'AAA');
// Review AAA-specific recommendations
```

## Best Practices

1. **Start with Level AA**: It's the standard for most compliance requirements
2. **Fix Level A issues first**: These are critical accessibility barriers
3. **Use Level A for quick checks**: When you need to identify the most serious issues
4. **Consider Level AAA for specific content**: Such as government sites or content for users with disabilities
5. **Monitor compliance over time**: Different pages may achieve different levels

## Testing Examples

You can test the different levels using the included `example-wcag-levels.html` file:

```bash
# Test for Level A only
mcp-accessibility-evaluator check_wcag_compliance --file example-wcag-levels.html --target-level A

# Test for Level AA (default)
mcp-accessibility-evaluator check_wcag_compliance --file example-wcag-levels.html --target-level AA

# Test for Level AAA
mcp-accessibility-evaluator check_wcag_compliance --file example-wcag-levels.html --target-level AAA
```

Each test will show different criteria being evaluated and different compliance levels being achieved.
