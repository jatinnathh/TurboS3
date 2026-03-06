# Types

This folder contains TypeScript type definitions and interfaces.

## Guidelines
- Define shared types used across multiple files
- Use clear, descriptive names
- Group related types together

## Example
```typescript
// user.types.ts
export interface User {
  id: string;
  email: string;
  displayName: string;
}

export type UserRole = 'admin' | 'user' | 'guest';
```


