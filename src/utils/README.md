# Utils

This folder contains utility functions and helper modules.

## Guidelines
- Pure functions that perform specific tasks
- No React-specific code (use hooks/ for that)
- Well-documented and testable

## Example
```typescript
// formatDate.ts
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString();
};
```


