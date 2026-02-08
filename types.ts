// types.ts
export interface Derivative {
  word: string;
  pattern: string;  // Changed from 'scheme' to 'pattern' to match App.tsx
}

export interface RootNode {
  root: string;
  derivatives: Derivative[];
  left: RootNode | null;
  right: RootNode | null;
  height: number;
}

export interface Scheme {
  name: string;
  pattern: string;
}