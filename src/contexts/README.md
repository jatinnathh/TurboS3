# Contexts

This folder contains React Context providers for global state management.

## Structure
- Each context should include the provider and custom hook
- Export both the context and the hook

## Example
```typescript
// AuthContext.tsx
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider = ({ children }) => { ... };
export const useAuth = () => { ... };
```

