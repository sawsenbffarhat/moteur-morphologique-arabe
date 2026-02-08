
import json

class Node:
    def __init__(self, root_str, derivatives=None):
        self.root = root_str
        self.derivatives = derivatives if derivatives else []
        self.left = None
        self.right = None
        self.height = 1

class ArabicBST:
    def __init__(self):
        self.root_node = None
        # STEP 3: THE GAME CHANGER - Inverse Index (Cache)
        # Complexity: O(1) for reverse lookup
        self.inverse_index = {}

    def insert(self, root_str, derivatives=None):
        """Insert a root into the BST (O(log n)) and update Inverse Index (O(1))."""
        if not self.root_node:
            self.root_node = Node(root_str, derivatives)
        else:
            self._insert(self.root_node, root_str, derivatives)
        
        # Automatically update the inverse index for all derivatives
        if derivatives:
            for d in derivatives:
                self.inverse_index[d['word']] = root_str

    def _insert(self, current, root_str, derivatives):
        if root_str < current.root:
            if current.left is None:
                current.left = Node(root_str, derivatives)
            else:
                self._insert(current.left, root_str, derivatives)
        elif root_str > current.root:
            if current.right is None:
                current.right = Node(root_str, derivatives)
            else:
                self._insert(current.right, root_str, derivatives)
        else:
            # Root exists, update derivatives list
            if derivatives:
                for d in derivatives:
                    exists = any(ex['word'] == d['word'] for ex in current.derivatives)
                    if not exists:
                        current.derivatives.append(d)
                        self.inverse_index[d['word']] = root_str

    def search(self, root_str):
        """O(log n) search for a root."""
        return self._search(self.root_node, root_str)

    def _search(self, current, root_str):
        if current is None or current.root == root_str:
            return current
        if root_str < current.root:
            return self._search(current.left, root_str)
        return self._search(current.right, root_str)

    def find_root_by_word(self, word):
        """O(1) lookup using the Inverse Index."""
        return self.inverse_index.get(word)

    def to_dict(self, node=None):
        target = node if node else self.root_node
        if not target:
            return None
        return {
            "root": target.root,
            "derivatives": target.derivatives,
            "left": self.to_dict(target.left) if target.left else None,
            "right": self.to_dict(target.right) if target.right else None
        }
