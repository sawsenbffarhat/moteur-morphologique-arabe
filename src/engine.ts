
import { Scheme } from '../types';

export const applyScheme = (root: string, pattern: string): string => {
  if (root.length !== 3) return "";
  
  // Arabic roots are trilateral: c1, c2, c3
  const c1 = root[0];
  const c2 = root[1];
  const c3 = root[2];

  // Pattern markers: 
  // 'ف' maps to c1
  // 'ع' maps to c2
  // 'ل' maps to c3
  
  let result = "";
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === 'ف') result += c1;
    else if (char === 'ع') result += c2;
    else if (char === 'ل') result += c3;
    else result += char;
  }
  return result;
};

export const validateDerivative = (word: string, root: string, schemes: Scheme[]): { isValid: boolean, scheme?: Scheme } => {
  if (root.length !== 3) return { isValid: false };
  
  for (const scheme of schemes) {
    const generated = applyScheme(root, scheme.pattern);
    if (generated === word) {
      return { isValid: true, scheme };
    }
  }
  
  return { isValid: false };
};

export const findRootFromWord = (word: string, schemes: Scheme[], knownRoots: string[]): { root: string, scheme: Scheme } | null => {
  for (const root of knownRoots) {
    const res = validateDerivative(word, root, schemes);
    if (res.isValid && res.scheme) {
      return { root, scheme: res.scheme };
    }
  }
  return null;
};
