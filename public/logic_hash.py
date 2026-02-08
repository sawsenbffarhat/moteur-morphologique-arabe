
class SchemeHashTable:
    def __init__(self, size=31):
        # Using 31 as specified in the report (optimal prime number)
        self.size = size
        self.table = [[] for _ in range(size)]
    def get_full_structure(self):
        """Return the entire hash table structure for visualization."""
        result = []
        for bucket in self.table:
            items = []
            for n, p in bucket:
                items.append({"name": n, "pattern": p})
            result.append(items)
        return result
    def _hash(self, key):
        """
        STEP 2: Hash function from the report.
        Sum of ord(char) % 31.
        Complexity: O(1)
        """
        total = sum(ord(char) for char in key)
        return total % self.size

    def insert(self, name, pattern):
        index = self._hash(name)
        bucket = self.table[index]
        for i, (n, p) in enumerate(bucket):
            if n == name:
                bucket[i] = (name, pattern)
                return
        bucket.append((name, pattern))

    def get(self, name):
        """Direct access O(1) to scheme pattern."""
        index = self._hash(name)
        for n, p in self.table[index]:
            if n == name:
                return p
        return None

    def get_all(self):
        all_schemes = []
        for bucket in self.table:
            for n, p in bucket:
                all_schemes.append({"name": n, "pattern": p})
        return all_schemes
  # Add these methods to the SchemeHashTable class:

def get_full_structure(self):
    """Return entire hash table for visualization."""
    result = []
    for bucket in self.table:
        items = []
        for n, p in bucket:
            items.append({"name": n, "pattern": p})
        result.append(items)
    return result

def remove(self, name):
    """Remove a scheme by name."""
    index = self._hash(name)
    # Create a new bucket without the scheme to remove
    new_bucket = []
    for item in self.table[index]:
        if item[0] != name:  # item[0] is the name, item[1] is the pattern
            new_bucket.append(item)
    self.table[index] = new_bucket
    return True  # Return success
def update(self, old_name, new_name, new_pattern):
    """Update an existing scheme."""
    self.remove(old_name)
    self.insert(new_name, new_pattern)
    
def get_scheme_names(self):
    """Get all scheme names."""
    names = []
    for bucket in self.table:
        for n, p in bucket:
            names.append(n)
    return names