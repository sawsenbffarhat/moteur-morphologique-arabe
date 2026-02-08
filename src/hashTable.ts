
import { Scheme } from '../types';

export class SchemeHashTable {
  private size: number;
  private table: (Scheme[])[];

  constructor(size: number = 31) {
    this.size = size;
    this.table = new Array(size).fill(null).map(() => []);
  }

  // Optimized hash function for Arabic characters to minimize complexity
  private hash(key: string): number {
    let hashValue = 0;
    for (let i = 0; i < key.length; i++) {
      hashValue = (hashValue << 5) - hashValue + key.charCodeAt(i);
      hashValue |= 0; // Convert to 32bit integer
    }
    return Math.abs(hashValue) % this.size;
  }

  insert(scheme: Scheme): void {
    const index = this.hash(scheme.name);
    const bucket = this.table[index];
    const existingIndex = bucket.findIndex(s => s.name === scheme.name);
    
    if (existingIndex !== -1) {
      bucket[existingIndex] = scheme;
    } else {
      bucket.push(scheme);
    }
  }

  get(name: string): Scheme | null {
    const index = this.hash(name);
    const bucket = this.table[index];
    return bucket.find(s => s.name === name) || null;
  }

  getAll(): Scheme[] {
    return this.table.flat();
  }

  remove(name: string): void {
    const index = this.hash(name);
    this.table[index] = this.table[index].filter(s => s.name !== name);
  }
}
