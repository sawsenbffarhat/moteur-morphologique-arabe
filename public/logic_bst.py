import json

class Node:
    def __init__(self, root_str, derivatives=None):
        self.root = root_str
        self.derivatives = derivatives if derivatives else []
        self.left = None
        self.right = None
        self.height = 1  # Keep this for AVL

class ArabicBST:
    def __init__(self):
        self.root_node = None
        # STEP 3: THE GAME CHANGER - Inverse Index (Cache)
        # Complexity: O(1) for reverse lookup
        self.inverse_index = {}

    # ========== NEW AVL HELPER METHODS ==========
    def _height(self, node):
        """Get height of node"""
        return node.height if node else 0

    def _update_height(self, node):
        """Update height of node based on children"""
        if node:
            node.height = 1 + max(self._height(node.left), self._height(node.right))

    def _balance_factor(self, node):
        """Calculate balance factor: left height - right height"""
        return self._height(node.left) - self._height(node.right) if node else 0

    def _rotate_right(self, y):
        """
        Right rotation
           y              x
          / \            / \
         x   T3   →    T1  y
        / \               / \
       T1 T2             T2 T3
        """
        x = y.left
        T2 = x.right

        # Perform rotation
        x.right = y
        y.left = T2

        # Update heights
        self._update_height(y)
        self._update_height(x)

        return x  # New root

    def _rotate_left(self, x):
        """
        Left rotation
           x                 y
          / \               / \
         T1  y      →      x   T3
            / \           / \
           T2 T3         T1 T2
        """
        y = x.right
        T2 = y.left

        # Perform rotation
        y.left = x
        x.right = T2

        # Update heights
        self._update_height(x)
        self._update_height(y)

        return y  # New root

    def _rebalance(self, node, root_str):
        """
        Check balance factor and rebalance if needed
        Returns the (possibly new) root of the subtree
        """
        if not node:
            return node

        # Update height
        self._update_height(node)

        # Get balance factor
        balance = self._balance_factor(node)

        # Case 1: Left Left (node is left heavy, new root inserted in left subtree of left child)
        if balance > 1 and root_str < node.left.root:
            return self._rotate_right(node)

        # Case 2: Right Right (node is right heavy, new root inserted in right subtree of right child)
        if balance < -1 and root_str > node.right.root:
            return self._rotate_left(node)

        # Case 3: Left Right (node is left heavy, new root inserted in right subtree of left child)
        if balance > 1 and root_str > node.left.root:
            node.left = self._rotate_left(node.left)
            return self._rotate_right(node)

        # Case 4: Right Left (node is right heavy, new root inserted in left subtree of right child)
        if balance < -1 and root_str < node.right.root:
            node.right = self._rotate_right(node.right)
            return self._rotate_left(node)

        # No rotation needed
        return node

    # ========== MODIFIED INSERT METHODS (AVL) ==========
    def insert(self, root_str, derivatives=None):
        """Insert a root into the AVL tree (O(log n)) and update Inverse Index (O(1))."""
        self.root_node = self._insert_avl(self.root_node, root_str, derivatives)
        
        # Automatically update the inverse index for all derivatives
        if derivatives:
            for d in derivatives:
                self.inverse_index[d['word']] = root_str

    def _insert_avl(self, node, root_str, derivatives):
        """Recursive AVL insert with balancing"""
        # Step 1: Normal BST insertion
        if node is None:
            return Node(root_str, derivatives)

        if root_str < node.root:
            node.left = self._insert_avl(node.left, root_str, derivatives)
        elif root_str > node.root:
            node.right = self._insert_avl(node.right, root_str, derivatives)
        else:
            # Root exists, update derivatives list
            if derivatives:
                for d in derivatives:
                    exists = any(ex['word'] == d['word'] for ex in node.derivatives)
                    if not exists:
                        node.derivatives.append(d)
                        self.inverse_index[d['word']] = root_str
            return node

        # Step 2: Rebalance if needed
        return self._rebalance(node, root_str)

    # ========== YOUR EXISTING METHODS (UNCHANGED) ==========
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

    # Optional: Add this helper method to see the tree structure with heights
    def print_tree(self, node=None, prefix="", is_left=True):
        """Print tree structure (useful for debugging)"""
        if node is None:
            node = self.root_node
            if node is None:
                print("Empty tree")
                return
        
        if node.right:
            self.print_tree(node.right, prefix + ("│   " if is_left else "    "), False)
        
        print(prefix + ("└── " if is_left else "┌── ") + f"{node.root} (h={node.height})")
        
        if node.left:
            self.print_tree(node.left, prefix + ("    " if is_left else "│   "), True)