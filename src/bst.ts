
import { RootNode, Derivative } from '../types';

export class ArabicBST {
  root: RootNode | null = null;

  insert(rootStr: string, derivatives: Derivative[] = []): void {
    const newNode: RootNode = {
      root: rootStr,
      derivatives,
      left: null,
      right: null,
      height: 1
    };

    if (!this.root) {
      this.root = newNode;
      return;
    }

    this._insert(this.root, newNode);
  }

  private _insert(node: RootNode, newNode: RootNode): void {
    if (newNode.root < node.root) {
      if (!node.left) node.left = newNode;
      else this._insert(node.left, newNode);
    } else if (newNode.root > node.root) {
      if (!node.right) node.right = newNode;
      else this._insert(node.right, newNode);
    } else {
      // Root already exists, update derivatives if provided
      if (newNode.derivatives.length > 0) {
        node.derivatives = [...new Set([...node.derivatives, ...newNode.derivatives])];
      }
    }
  }

  search(rootStr: string): RootNode | null {
    return this._search(this.root, rootStr);
  }

  private _search(node: RootNode | null, rootStr: string): RootNode | null {
    if (!node || node.root === rootStr) return node;
    if (rootStr < node.root) return this._search(node.left, rootStr);
    return this._search(node.right, rootStr);
  }

  getAllRoots(): RootNode[] {
    const result: RootNode[] = [];
    this._inOrder(this.root, result);
    return result;
  }

  private _inOrder(node: RootNode | null, result: RootNode[]): void {
    if (!node) return;
    this._inOrder(node.left, result);
    result.push(node);
    this._inOrder(node.right, result);
  }

  addValidatedDerivative(rootStr: string, derivative: Derivative): boolean {
    const node = this.search(rootStr);
    if (node) {
      const exists = node.derivatives.find(d => d.word === derivative.word);
      if (!exists) {
        node.derivatives.push(derivative);
        return true;
      }
    }
    return false;
  }
}
