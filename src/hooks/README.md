# Hooks

This folder contains custom React hooks.

## Guidelines
- Hook names should start with 'use'
- Keep hooks focused on a single responsibility
- Document parameters and return values

## Example
```typescript
// useAuth.ts
export const useAuth = () => {
  // Hook logic here
  return { user, loading, error };
};
```

