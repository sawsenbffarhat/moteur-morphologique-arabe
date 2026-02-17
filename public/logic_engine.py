import re
class MorphEngine:
    @staticmethod
    def _strip_tashkeel(text):
        """Remove diacritics from Arabic text"""
        tashkeel_re = re.compile(r'[\u064B-\u0652]')
        return tashkeel_re.sub('', text)

    @staticmethod
    def _handle_irregularities(word, root, pattern, is_definite=False):
        """Handle special Arabic morphological cases with logging"""
        print(f"\n  🔧 _handle_irregularities ENTERED")
        print(f"    Input word: '{word}'")
        print(f"    Root: '{root}'")
        print(f"    Pattern: '{pattern}'")
        print(f"    is_definite: {is_definite}")
        
        c1, c2, c3 = root[0], root[1], root[2]
        print(f"    Root letters: c1='{c1}', c2='{c2}', c3='{c3}'")
        
        original_word = word
        
        # Redoubled roots
        if c2 == c3:
            print(f"    📍 Redoubled root detected (c2 == c3)")
            pattern_regex = f"{c2}([\u064B-\u0652]*){c2}"
            if re.search(pattern_regex, word):
                word = re.sub(pattern_regex, f"{c2}ّ\\1", word)
                print(f"    Applied redoubled rule: '{original_word}' → '{word}'")

        # Hollow roots
        if c2 in ['و', 'ي']:
            print(f"    📍 Hollow root detected (c2 is و or ي)")
            if pattern == 'فَاعِل':
                word = word.replace(f"َا{c2}", "َائ")
                print(f"    Applied hollow فَاعِل rule: '{original_word}' → '{word}'")
            elif pattern == 'فَعَلَ':
                word = f"{c1}َالَ"
                print(f"    Applied hollow فَعَلَ rule: '{original_word}' → '{word}'")
            elif pattern == 'يَفْعَلُ':
                word = word.replace(f"{c2}", "ُو")
                print(f"    Applied hollow يَفْعَلُ rule: '{original_word}' → '{word}'")
            elif pattern == 'مَفْعُول':
                word = word.replace(f"{c2}", "ُو")
                print(f"    Applied hollow مَفْعُول rule: '{original_word}' → '{word}'")
            elif pattern in ['اِفْتِعَال', 'اِسْتِفْعَال']:
                if c2 == 'و':
                    word = word.replace(f"ت{c2}", "تِي")
                elif c2 == 'ي':
                    word = word.replace(f"ت{c2}", "تِي")
                print(f"    Applied hollow {pattern} rule: '{original_word}' → '{word}'")
        
        # Hamzated roots - First letter
        if c1 in ['ء', 'أ', 'إ', 'ؤ', 'ئ']:
            print(f"    📍 First letter hamza detected")
            if pattern == 'فَاعِل':
                word = word.replace("أَأ", "آ")
                print(f"    Applied first hamza فَاعِل rule: '{original_word}' → '{word}'")
            elif pattern in ['اِفْتِعَال', 'اِسْتِفْعَال']:
                word = word.replace("ائ", "ئ")
                print(f"    Applied first hamza {pattern} rule: '{original_word}' → '{word}'")
        
        # Hamzated roots - Second letter
        if c2 in ['ء', 'أ', 'إ', 'ؤ', 'ئ']:
            print(f"    📍 Second letter hamza detected")
            if pattern == 'فَاعِل':
                word = word.replace(f"ا{c2}", "ائ")
                print(f"    Applied second hamza فَاعِل rule: '{original_word}' → '{word}'")
            elif pattern == 'مَفْعُول':
                word = word.replace(f"{c2}", "ؤ")
                print(f"    Applied second hamza مَفْعُول rule: '{original_word}' → '{word}'")
            elif pattern in ['اِفْتِعَال', 'اِسْتِفْعَال']:
                word = word.replace("تأ", "تئ")
                print(f"    Applied second hamza {pattern} rule: '{original_word}' → '{word}'")
        
        # Hamzated roots - Third letter (FIXED for اِسْتِفْعَال)
        if c3 in ['ء', 'أ', 'إ', 'ؤ', 'ئ']:
            print(f"    📍 Third letter hamza detected")
            original_before = word
            
            if pattern == 'فَاعِل':
                word = word.replace(f"{c3}", "ئ")
                print(f"    Applied third hamza فَاعِل rule: '{original_before}' → '{word}'")
            
            elif pattern == 'مَفْعُول':
                word = word.replace(f"{c3}", "ء")
                word = word.replace("ؤء", "وء")
                print(f"    Applied third hamza مَفْعُول rule: '{original_before}' → '{word}'")
            
            elif pattern == 'اِفْتِعَال':
                if word.endswith('اأ'):
                    word = word[:-2] + 'اء'
                    print(f"    Applied third hamza اِفْتِعَال rule: '{original_before}' → '{word}'")
                else:
                    word = word.replace(f"{c3}", "اء")
                    print(f"    Applied third hamza اِفْتِعَال rule: '{original_before}' → '{word}'")
            
            elif pattern == 'اِسْتِفْعَال':  # YOUR PATTERN with kasra
                print(f"    ⭐ Processing استفعال pattern with kasra")
                # The word currently ends with "اأ" (alif + hamza)
                # We need to change it to "اء" (alif + hamza on the alif)
                if word.endswith('اأ'):
                    word = word[:-2] + 'اء'
                    print(f"    Fixed final hamza (اأ → اء): '{original_before}' → '{word}'")
                elif word.endswith('أ'):
                    word = word[:-1] + 'ء'
                    print(f"    Fixed final hamza (أ → ء): '{original_before}' → '{word}'")
                else:
                    # Fallback: try to replace the hamza directly
                    word = word.replace('أ', 'ء')
                    print(f"    Fixed final hamza (fallback): '{original_before}' → '{word}'")
            
            elif pattern == 'فَعَلَ':
                word = word.replace(f"{c3}", "أ")
                print(f"    Applied third hamza فَعَلَ rule: '{original_before}' → '{word}'")

        # Assimilated roots
        if c1 in ['و', 'ي']:
            print(f"    📍 Assimilated root detected (c1 is و or ي)")
            if pattern in ['اِفْتِعَال', 'اِسْتِفْعَال']:
                word = word.replace(f"{c1}ت", "تّ")
                print(f"    Applied assimilated {pattern} rule: '{original_word}' → '{word}'")

        # Defective roots
        if c3 in ['و', 'ي']:
            print(f"    📍 Defective root detected (c3 is و or ي)")
            if pattern == 'فَاعِل':
                word = word.replace(f"{c3}ِ", "ٍ")
                print(f"    Applied defective فَاعِل rule: '{original_word}' → '{word}'")
            elif pattern == 'مَفْعُول':
                if not word.endswith('يّ'):
                    word = word + 'يّ'
                    print(f"    Applied defective مَفْعُول rule: '{original_word}' → '{word}'")

        # Definite article
        if is_definite:
            print(f"    📍 Adding definite article")
            sun_letters = ['ت', 'ث', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ل', 'ن']
            if word.startswith('أ') or word.startswith('إ') or word.startswith('آ'):
                word = 'ال' + word[1:]
                print(f"    Added definite article (hamza case): '{original_word}' → '{word}'")
            elif word and word[0] in sun_letters:
                word = word[0] + 'ّ' + word[1:]
                print(f"    Added definite article (sun letter): '{original_word}' → '{word}'")
            else:
                word = 'ال' + word
                print(f"    Added definite article (moon letter): '{original_word}' → '{word}'")

        print(f"  🔧 _handle_irregularities EXIT: '{word}'")
        return word

    @staticmethod
    def apply_scheme(root, pattern, is_definite=False):
        """
        Generate a word from a root and morphological pattern
        """
        print(f"\n🔵🔵🔵 apply_scheme CALLED 🔵🔵🔵")
        print(f"   Parameters:")
        print(f"     root: '{root}'")
        print(f"     pattern: '{pattern}'")
        print(f"     is_definite: {is_definite}")
        
        if len(root) != 3:
            print(f"   ❌ ERROR: Root length is {len(root)}, must be 3")
            return ""
        
        c1, c2, c3 = root[0], root[1], root[2]
        print(f"   Root letters: c1='{c1}', c2='{c2}', c3='{c3}'")
        
        result = ""
        print(f"   Building word character by character:")
        
        for i, char in enumerate(pattern):
            if char == 'ف':
                result += c1
                print(f"     Step {i+1}: '{char}' → first letter '{c1}' → result: '{result}'")
            elif char == 'ع':
                result += c2
                print(f"     Step {i+1}: '{char}' → second letter '{c2}' → result: '{result}'")
            elif char == 'ل':
                result += c3
                print(f"     Step {i+1}: '{char}' → third letter '{c3}' → result: '{result}'")
            else:
                result += char
                print(f"     Step {i+1}: '{char}' → keep pattern char → result: '{result}'")
        
        print(f"   Basic generation result (before irregularities): '{result}'")
        
        final_result = MorphEngine._handle_irregularities(result, root, pattern, is_definite)
        print(f"   🔵 FINAL RESULT: '{final_result}'")
        print(f"🔵🔵🔵 apply_scheme COMPLETED 🔵🔵🔵\n")
        
        return final_result

    @staticmethod
    def validate(word, root, schemes, bst):
        """Optimized Validation - Two-step process"""
        print(f"\n🟢🟢🟢 validate CALLED 🟢🟢🟢")
        print(f"   word: '{word}'")
        print(f"   root: '{root}'")
        print(f"   schemes: {schemes}")
        
        word_without_tashkeel = MorphEngine._strip_tashkeel(word)
        print(f"   word without tashkeel: '{word_without_tashkeel}'")
        
        cached_root = bst.find_root_by_word(word)
        print(f"   cached_root: '{cached_root}'")
        
        if cached_root == root:
            print(f"   ⚡ CACHE HIT! Using fast path")
            for s in schemes:
                print(f"     Checking scheme: {s['name']} = '{s['pattern']}'")
                generated = MorphEngine.apply_scheme(root, s['pattern'], word.startswith('ال'))
                generated_without = MorphEngine._strip_tashkeel(generated)
                print(f"       generated: '{generated}'")
                print(f"       generated without tashkeel: '{generated_without}'")
                if generated_without == word_without_tashkeel or generated == word:
                    print(f"       ✅ MATCH FOUND in cache path!")
                    return True, s

        if len(root) != 3:
            print(f"   ❌ Invalid root length")
            return False, None
        
        is_def = word.startswith('ال')
        print(f"   is_def: {is_def}")
        print(f"   🔄 FULL VALIDATION PATH")
        
        for s in schemes:
            print(f"     Testing scheme: {s['name']} = '{s['pattern']}'")
            generated = MorphEngine.apply_scheme(root, s['pattern'], is_def)
            generated_without = MorphEngine._strip_tashkeel(generated)
            print(f"       generated: '{generated}'")
            print(f"       generated without tashkeel: '{generated_without}'")
            if generated_without == word_without_tashkeel or generated == word:
                print(f"       ✅ MATCH FOUND in full path!")
                bst.insert(root, [{"word": word, "pattern": s['name']}])
                print(f"       📝 Added to cache: '{word}' → '{root}'")
                return True, s
        
        print(f"   ❌ No match found")
        return False, None


if __name__ == "__main__":
    print("=" * 60)
    print("🧪 TESTING MORPHOLOGICAL ENGINE WITH LOGS")
    print("=" * 60)
    
    # Test cases
    tests = [
        ("كتب", "فَاعِل", "كَاتِب"),
        ("قرأ", "فَاعِل", "قَارِئ"),
        ("قرأ", "اِسْتِفْعَال", "اِسْتِقْرَاء"),  # Your pattern with kasra
        ("قول", "فَاعِل", "قَائِل"),
        ("عمل", "فَاعِل", "عَامِل"),
    ]
    
    for root, pattern, expected in tests:
        print(f"\n{'='*50}")
        print(f"TEST: {root} + {pattern}")
        print(f"{'='*50}")
        result = MorphEngine.apply_scheme(root, pattern, False)
        status = "✅" if result == expected else "❌"
        print(f"\n{status} RESULT: '{result}' (expected: '{expected}')")