# Types Reference

Complete TypeScript type definitions for MyProject.

## Overview

This page documents all TypeScript types used in MyProject. For method signatures, see [Methods Reference](./methods.md).

## Core Types

### ProcessedResult

Result type from `myFunction()`.

**Definition:**
```typescript
interface ProcessedResult {
  data: string;
  timestamp: number;
  success: boolean;
}
```

**Usage:**
```typescript
import { myFunction, ProcessedResult } from 'myproject';

const result: ProcessedResult = myFunction('input');
```

See [Methods Reference](./methods.md#myfunction) for usage.

### FinalResult

Result type from `anotherFunction()`.

**Definition:**
```typescript
interface FinalResult {
  processed: ProcessedResult;
  final: string;
  metadata: Metadata;
}
```

**Properties:**
- `processed` - Original processed result
- `final` - Final processed value
- `metadata` - Additional metadata

### Metadata

Metadata type.

**Definition:**
```typescript
interface Metadata {
  version: string;
  timestamp: number;
  [key: string]: unknown;
}
```

## Input Types

### InputData

Input data type for transformations.

**Definition:**
```typescript
type InputData = string | number | object;
```

**Usage:**
```typescript
import { transformData, InputData } from 'myproject';

const input: InputData = { value: 'test' };
const output = transformData(input);
```

## Output Types

### OutputData

Output data type from transformations.

**Definition:**
```typescript
interface OutputData {
  transformed: string;
  original: InputData;
}
```

## Configuration Types

### MyProjectConfig

Configuration type for MyProject.

**Definition:**
```typescript
interface MyProjectConfig {
  option1?: string;
  option2?: boolean;
  advanced?: AdvancedConfig;
}
```

See [Configuration Guide](../guides/configuration.md) for configuration details.

### AdvancedConfig

Advanced configuration options.

**Definition:**
```typescript
interface AdvancedConfig {
  feature1?: {
    enabled: boolean;
    options?: Record<string, unknown>;
  };
}
```

## Error Types

### ValidationError

Thrown when input validation fails.

**Definition:**
```typescript
class ValidationError extends Error {
  code: 'VALIDATION_ERROR';
  input: unknown;
}
```

### ProcessingError

Thrown when processing fails.

**Definition:**
```typescript
class ProcessingError extends Error {
  code: 'PROCESSING_ERROR';
  context: Record<string, unknown>;
}
```

## Utility Types

### Options

Generic options type.

**Definition:**
```typescript
type Options<T> = {
  [K in keyof T]?: T[K];
};
```

## Type Guards

### isProcessedResult

Type guard for ProcessedResult.

**Definition:**
```typescript
function isProcessedResult(value: unknown): value is ProcessedResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'timestamp' in value &&
    'success' in value
  );
}
```

**Usage:**
```typescript
if (isProcessedResult(result)) {
  // TypeScript knows result is ProcessedResult
  console.log(result.data);
}
```

## Type Examples

### Basic Type Usage

```typescript
import { myFunction, ProcessedResult } from 'myproject';

const result: ProcessedResult = myFunction('input');
console.log(result.data);
```

### Advanced Type Usage

```typescript
import {
  myFunction,
  anotherFunction,
  ProcessedResult,
  FinalResult
} from 'myproject';

const step1: ProcessedResult = myFunction('input');
const step2: FinalResult = anotherFunction(step1);
```

See [Advanced Tutorial](../tutorials/advanced.md#pattern-3-type-safety) for more examples.

## Related Documentation

- [API Overview](./overview.md)
- [Methods Reference](./methods.md)
- [Getting Started Tutorial](../tutorials/getting-started.md)
- [Configuration Guide](../guides/configuration.md)
