# Configuration Guide

The MCP Accessibility Evaluator supports comprehensive configuration through JSON files, environment variables, and package.json settings. This guide explains how to customize the tool's behavior for your specific needs.

## Quick Start

1. **Copy the base configuration**:

   ```bash
   cp accessibility.config.json my-accessibility.config.json
   ```

2. **Modify settings** as needed (see examples below)

3. **The tool will automatically find and use your configuration**

## Configuration File Locations

The tool searches for configuration files in this order of priority:

1. **Explicitly specified paths** (via `ConfigLoader.addConfigPath()`)
2. **Project-level configs**:
   - `accessibility.config.json`
   - `accessibility.config.js` (coming soon)
   - `.accessibilityrc.json`
   - `.accessibilityrc`
3. **Package.json field**: `"accessibility": { ... }`
4. **Home directory**: `~/.accessibility.config.json`
5. **System-wide**: `/etc/accessibility/config.json`

## Configuration Structure

### WCAG Settings (`wcag`)

```json
{
  "wcag": {
    "defaultLevel": "AA",  // Default WCAG level: "A", "AA", or "AAA"
    "strictMode": false,  // Enable strict interpretation of guidelines
    "enabledCriteria": [],  // Only check these criteria (empty = all)
    "disabledCriteria": [],  // Skip these criteria
    "customCriteria": []  // Add custom WCAG criteria
  }
}
```

**Examples**:

- **Level A only**: `"defaultLevel": "A"`
- **Skip reading level**: `"disabledCriteria": ["3.1.5"]`
- **Only check images**: `"enabledCriteria": ["1.1.1"]`

### ARIA Settings (`aria`)

```json
{
  "aria": {
    "enableValidation": true,       // Enable/disable ARIA validation
    "ignoreDeprecated": true,       // Ignore deprecated ARIA features
    "strictMode": false,            // Strict ARIA specification adherence
    "customRoles": []               // Define custom ARIA roles
  }
}
```

### Evaluation Settings (`evaluation`)

```json
{
  "evaluation": {
    "includePassedChecks": true,    // Include successful checks in results
    "minImpactLevel": "minor",      // Minimum impact level to report
    "enableEnhancedExplanations": true,  // Include detailed explanations
    "includeCodeExamples": true,    // Include code fix examples
    "enableDocumentationLinks": true    // Include links to guidelines
  }
}
```

**Impact Levels**: `"minor"`, `"moderate"`, `"serious"`, `"critical"`

### Reporting Settings (`reporting`)

```json
{
  "reporting": {
    "format": "detailed",  // Report format: "detailed", "summary", "compact"
    "includeRecommendations": true,  // Include fix recommendations
    "groupByPrinciple": false,  // Group issues by WCAG principle
    "showProgressScores": true,  // Show percentage scores
    "includeMetadata": true  // Include evaluation metadata
  }
}
```

### Axe-core Settings (`axe`)

```json
{
  "axe": {
    "rules": {
      // Configure specific axe rules
      "color-contrast": {
        "enabled": true,
        "options": {}
      }
    },
    "tags": ["wcag2a", "wcag2aa"],  // Which rule tags to include
    "resultTypes": ["violations", "incomplete"]  // Types of results to return
  }
}
```

## Example Configurations

### 1. Basic Level A Configuration

For minimal compliance checking:

```json
{
  "wcag": {
    "defaultLevel": "A"
  },
  "evaluation": {
    "minImpactLevel": "serious",
    "includeCodeExamples": false
  },
  "reporting": {
    "format": "summary"
  }
}
```

### 2. Standard Level AA Configuration

For typical web accessibility compliance:

```json
{
  "wcag": {
    "defaultLevel": "AA",
    "strictMode": false
  },
  "aria": {
    "enableValidation": true,
    "ignoreDeprecated": true
  },
  "evaluation": {
    "minImpactLevel": "minor",
    "enableEnhancedExplanations": true
  },
  "reporting": {
    "format": "detailed",
    "includeRecommendations": true
  }
}
```

### 3. Comprehensive Level AAA Configuration

For maximum accessibility compliance:

```json
{
  "wcag": {
    "defaultLevel": "AAA",
    "strictMode": true
  },
  "aria": {
    "enableValidation": true,
    "strictMode": true,
    "ignoreDeprecated": false
  },
  "evaluation": {
    "includePassedChecks": true,
    "minImpactLevel": "minor",
    "enableEnhancedExplanations": true,
    "includeCodeExamples": true
  },
  "reporting": {
    "format": "detailed",
    "groupByPrinciple": true,
    "showProgressScores": true
  }
}
```

### 4. Development Configuration

Optimized for developers:

```json
{
  "wcag": {
    "defaultLevel": "AA",
    "disabledCriteria": ["3.1.5"]  // Skip reading level during development
  },
  "evaluation": {
    "includePassedChecks": false,  // Focus on issues only
    "minImpactLevel": "moderate"
  },
  "reporting": {
    "format": "detailed",
    "includeMetadata": false  // Less verbose output
  },
  "axe": {
    "rules": {
      "bypass": { "enabled": false },  // Skip for prototypes
      "landmark-one-main": { "enabled": false }
    }
  }
}
```

## Environment Variables

You can override configuration using environment variables:

```bash
# Set default WCAG level
export ACCESSIBILITY_WCAG_LEVEL=AAA

# Enable/disable ARIA validation
export ACCESSIBILITY_ARIA_VALIDATION=true

# Set minimum impact level
export ACCESSIBILITY_MIN_IMPACT=serious

# Set reporting format
export ACCESSIBILITY_REPORT_FORMAT=summary
```

## Package.json Integration

Add configuration directly to your `package.json`:

```json
{
  "name": "my-project",
  "accessibility": {
    "wcag": {
      "defaultLevel": "AA"
    },
    "reporting": {
      "format": "summary"
    }
  }
}
```

## Configuration Priority

Settings are merged in this order (later overrides earlier):

1. **Default values**
2. **Configuration file** (first found)
3. **Environment variables**
4. **Tool arguments** (if provided)

## Validation

The configuration system validates your settings and will show warnings for:

- Invalid WCAG levels
- Malformed criterion IDs
- Unknown impact levels
- Invalid reporting formats

## Advanced Usage

### Custom WCAG Criteria

```json
{
  "wcag": {
    "customCriteria": [
      {
        "id": "custom.1.1",
        "name": "Custom Requirement",
        "level": "AA",
        "principle": "Perceivable",
        "guideline": "Custom Guidelines",
        "techniques": [],
        "commonFailures": []
      }
    ]
  }
}
```

### Selective Rule Enabling

```json
{
  "wcag": {
    "enabledCriteria": ["1.1.1", "1.3.1", "2.1.1"]  // Only check these
  }
}
```

### Custom Axe Rules

```json
{
  "axe": {
    "rules": {
      "color-contrast": {
        "enabled": true,
        "options": {
          "noScroll": true
        }
      },
      "image-alt": {
        "enabled": false  // Disable this rule
      }
    }
  }
}
```

## Troubleshooting

### Configuration Not Loading

- Check file syntax with a JSON validator
- Verify file permissions
- Look for error messages in the console

### Unexpected Behavior

- Check environment variables that might override settings
- Verify WCAG criterion IDs are formatted correctly (e.g., "1.1.1")
- Ensure impact levels are valid: "minor", "moderate", "serious", "critical"

### Performance Issues

- Reduce `minImpactLevel` to focus on serious issues only
- Set `includePassedChecks: false` to reduce output
- Use `"format": "summary"` for faster reporting

## Migration from Default Settings

If you were using tool arguments before, here's how to migrate to config files:

**Before**:

```javascript
check_wcag_compliance({ html, targetLevel: "A" })
```

**After** (in config file):

```json
{
  "wcag": {
    "defaultLevel": "A"
  }
}
```

The tool arguments still work and will override config file settings when provided.

## Support

For configuration questions or issues:

1. Check the example configurations in `config-examples/`
2. Validate your JSON syntax
3. Review the console output for configuration load messages
4. File an issue with your configuration file attached
