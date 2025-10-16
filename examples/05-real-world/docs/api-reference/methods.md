# Methods Reference

Complete reference for all MyProject methods.

## Overview

This page documents all available methods in MyProject. For general API information, see [API Overview](./overview.md).

## Core Methods

### myFunction

Primary processing function.

**Signature:**
```typescript
function myFunction(input: string): ProcessedResult
```

**Parameters:**
- `input` (string) - The input to process

**Returns:**
- `ProcessedResult` - The processed result

**Example:**
```javascript
import { myFunction } from 'myproject';

const result = myFunction('hello');
console.log(result);
```

**Throws:**
- `ValidationError` - If input is invalid
- `ProcessingError` - If processing fails

See [Types Reference](./types.md#processedresult) for return type details.

### anotherFunction

Secondary processing function.

**Signature:**
```typescript
function anotherFunction(data: ProcessedResult): FinalResult
```

**Parameters:**
- `data` (ProcessedResult) - Previously processed data

**Returns:**
- `FinalResult` - The final result

**Example:**
```javascript
import { myFunction, anotherFunction } from 'myproject';

const step1 = myFunction('input');
const step2 = anotherFunction(step1);
```

See [Types Reference](./types.md) for type definitions.

## Utility Methods

### validateInput

Validates input before processing.

**Signature:**
```typescript
function validateInput(input: string): boolean
```

**Parameters:**
- `input` (string) - Input to validate

**Returns:**
- `boolean` - True if valid, false otherwise

**Example:**
```javascript
import { validateInput, myFunction } from 'myproject';

if (validateInput('test')) {
  myFunction('test');
}
```

### transformData

Transforms data between formats.

**Signature:**
```typescript
function transformData(data: InputData): OutputData
```

**Parameters:**
- `data` (InputData) - Data to transform

**Returns:**
- `OutputData` - Transformed data

See [Types Reference](./types.md) for InputData and OutputData types.

## Error Handling

All methods may throw errors. Use try-catch:

```javascript
import { myFunction } from 'myproject';

try {
  const result = myFunction('input');
} catch (error) {
  console.error('Error:', error.message);
}
```

For troubleshooting, see [Troubleshooting Guide](../guides/troubleshooting.md).

## Method Chaining

Methods can be chained:

```javascript
import { myFunction, anotherFunction, transformData } from 'myproject';

const result = transformData(anotherFunction(myFunction('input')));
```

See [Advanced Tutorial](../tutorials/advanced.md) for chaining patterns.

## Asynchronous Methods

Some methods are async:

```javascript
import { asyncFunction } from 'myproject';

const result = await asyncFunction('input');
```

## Configuration Impact

Methods respect global configuration. See [Configuration Guide](../guides/configuration.md).

## Related Documentation

- [API Overview](./overview.md)
- [Types Reference](./types.md)
- [Getting Started Tutorial](../tutorials/getting-started.md)
- [Advanced Tutorial](../tutorials/advanced.md)
