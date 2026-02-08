
import re

class MorphEngine:
    @staticmethod
    def _strip_tashkeel(text):
        tashkeel_re = re.compile(r'[\u064B-\u0652]')
        return tashkeel_re.sub('', text)

    @staticmethod
    def _handle_irregularities(word, root, pattern, is_definite=False):
        c1, c2, c3 = root[0], root[1], root[2]
        
        # Redoubled
        if c2 == c3:
            pattern_regex = f"{c2}([\u064B-\u0652]*){c2}"
            if re.search(pattern_regex, word):
                word = re.sub(pattern_regex, f"{c2}ّ\\1", word)

        # Hollow
        if c2 in ['و', 'ي']:
            if 'فَاعِل' in pattern:
                word = word.replace(f"َا{c2}ِ", "َائـِ").replace(f"َا{c2}", "َائـ")
            elif pattern == 'فَعَلَ':
                word = f"{c1}َالَ"

        # Article
        if is_definite:
            word = 'ال' + word

        return word

    @staticmethod
    def apply_scheme(root, pattern, is_definite=False):
        if len(root) != 3: return ""
        c1, c2, c3 = root[0], root[1], root[2]
        result = ""
        for char in pattern:
            if char == 'ف': result += c1
            elif char == 'ع': result += c2
            elif char == 'ل': result += c3
            else: result += char
        return MorphEngine._handle_irregularities(result, root, pattern, is_definite)

    @staticmethod
    def validate(word, root, schemes, bst):
        """
        Optimized Validation.
        1. Check Inverse Index O(1)
        2. If fail, use Schemes O(m)
        """
        # Step 3 Optimization: Check Cache
        cached_root = bst.find_root_by_word(word)
        if cached_root == root:
            # We already know this word belongs to this root
            # Just find which scheme it was (O(m) in hash table bucket)
            for s in schemes:
                if MorphEngine.apply_scheme(root, s['pattern'], word.startswith('ال')) == word:
                    return True, s

        # Fallback to full generation check
        if len(root) != 3: return False, None
        is_def = word.startswith('ال')
        for s in schemes:
            generated = MorphEngine.apply_scheme(root, s['pattern'], is_def)
            if generated == word:
                # Learn and update index for next time
                bst.insert(root, [{"word": word, "pattern": s['name']}])
                return True, s
        return False, None
