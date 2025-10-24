# Guide

Guide for understanding warning-based configuration.

## Why Warnings?

Warnings provide feedback without blocking:
- CI builds still pass
- Issues are visible
- Teams can fix at their pace

## Configuring Warnings

Set any rule to `'warn'` in configuration:

```yaml
rules:
  rule-name: warn
```

## Best Practices

Use warnings for:
- New projects being documented
- Large-scale documentation refactoring
- Teams learning documentation standards

Use errors for:
- Critical documentation
- Public-facing docs
- Final release checks

## Return

Back to [README](./README.md).
