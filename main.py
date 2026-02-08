
import os
import sys
import json
from logic_bst import ArabicBST
from logic_hash import SchemeHashTable
from logic_engine import MorphEngine

# Force UTF-8 encoding for standard output to support Arabic Shakl in all terminals
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header():
    print("\033[1;36m" + "=" * 60 + "\033[0m")
    print("\033[1;33m" + "          المُصَرِّف المَشْكُول الذكي - Pure Python v3.0" + "\033[0m")
    print("\033[1;36m" + "=" * 60 + "\033[0m")

def print_tree(node, prefix="", is_left=True):
    """Recursively prints the BST in a text-based format."""
    if node is not None:
        print_tree(node.right, prefix + ("│   " if is_left else "    "), False)
        print(prefix + ("└── " if is_left else "┌── ") + "\033[1;32m" + str(node.root) + "\033[0m")
        print_tree(node.left, prefix + ("    " if is_left else "│   "), True)

def main():
    # 1. Initialize Logic
    bst = ArabicBST()
    ht = SchemeHashTable()
    engine = MorphEngine()

    # 2. Load Initial Roots
    try:
        with open('racines.txt', 'r', encoding='utf-8') as f:
            roots = [line.strip() for line in f if line.strip()]
            for r in roots:
                bst.insert(r)
    except FileNotFoundError:
        # Fallback if file is missing
        default_roots = ["كتب", "درس", "عمل", "قول", "ردد", "رمي", "أكل"]
        for r in default_roots:
            bst.insert(r)

    # 3. Load Vocalized Schemes (الأوزان المشكولة)
    initial_schemes = [
        ("اسم فاعل", "فَاعِل"), 
        ("اسم مفعول", "مَفْعُول"), 
        ("المصدر", "اِفْتِعَال"), 
        ("الماضي", "فَعَلَ"),
        ("المضارع", "يَفْعَلُ"),
        ("اسم المكان", "مَفْعَل"), 
        ("الطلب", "اِسْتِفْعَال")
    ]
    for name, patt in initial_schemes:
        ht.insert(name, patt)

    while True:
        clear_screen()
        print_header()
        print("\n\033[1m[1]\033[0m عرض هيكل الجذور (BST Visualizer)")
        print("\033[1m[2]\033[0m توليد اشتقاق جديد (Derivation Generator)")
        print("\033[1m[3]\033[0m تحليل كلمة (Morphological Validator)")
        print("\033[1m[4]\033[0m إضافة جذر جديد (Add Root)")
        print("\033[1m[5]\033[0m خروج (Exit)")
        
        choice = input("\n\033[1;35mاختر الخيار المناسب: \033[0m").strip()

        if choice == '1':
            clear_screen()
            print_header()
            print("\n--- هيكل الجذور المحفوظة في الـ BST ---\n")
            if bst.root_node:
                print_tree(bst.root_node)
            else:
                print("المكتبة فارغة.")
            input("\n\033[2mاضغط Enter للعودة إلى القائمة الرئيسية...\033[0m")

        elif choice == '2':
            clear_screen()
            print_header()
            roots_list = []
            def collect(n):
                if n:
                    collect(n.left)
                    roots_list.append(n.root)
                    collect(n.right)
            collect(bst.root_node)

            print("\n\033[1mالجذور المتوفرة:\033[0m", " | ".join(roots_list))
            root = input("\033[1;34mأدخل الجذر (مثلاً: كتب): \033[0m").strip()
            
            schemes = ht.get_all()
            print("\n\033[1mالأوزان المتوفرة:\033[0m")
            for i, s in enumerate(schemes):
                print(f"[{i+1}] {s['name']} ({s['pattern']})")
            
            s_idx = input("\n\033[1;34mاختر رقم الوزن: \033[0m").strip()
            is_def = input("\033[1;34mهل تريد إضافة الـ التعريف؟ (ن/ل): \033[0m").strip().lower() == 'ن'
            
            try:
                pattern = schemes[int(s_idx)-1]['pattern']
                result = engine.apply_scheme(root, pattern, is_def)
                print(f"\n" + "-"*30)
                print(f"الاشتقاق النهائي: \033[1;32m{result}\033[0m")
                print(f"-"*30)
                # Save to BST
                bst.insert(root, [{"word": result, "pattern": pattern}])
            except (ValueError, IndexError):
                print("\n\033[1;31mخطأ: اختيار غير صحيح.\033[0m")
            input("\nاضغط Enter للعودة...")

        elif choice == '3':
            clear_screen()
            print_header()
            print("\n--- المحلل الصرفي الذكي ---")
            word = input("\033[1;34mأدخل الكلمة (مع التشكيل أو بدونه): \033[0m").strip()
            root = input("\033[1;34mأدخل الجذر الثلاثي المتوقع: \033[0m").strip()
            
            is_valid, scheme = engine.validate(word, root, ht.get_all())
            
            if is_valid:
                print(f"\n\033[1;32m✅ توافق صرفي ناجح!\033[0m")
                print(f"الكلمة تتبع وزن: \033[1m{scheme['name']}\033[0m (\033[1;36m{scheme['pattern']}\033[0m)")
                bst.insert(root, [{"word": word, "pattern": scheme['name']}])
            else:
                print("\n\033[1;31m❌ لا يوجد توافق صرفي لهذه الكلمة مع هذا الجذر.\033[0m")
            input("\nاضغط Enter للعودة...")

        elif choice == '4':
            new_root = input("\033[1;34mأدخل الجذر الجديد (3 أحرف): \033[0m").strip()
            if len(new_root) == 3:
                bst.insert(new_root)
                print(f"\033[1;32mتمت إضافة {new_root} إلى هيكل البيانات بنجاح.\033[0m")
            else:
                print("\033[1;31mخطأ: يجب أن يتكون الجذر من 3 أحرف فقط.\033[0m")
            input("\nاضغط Enter للعودة...")

        elif choice == '5':
            print("\nشكرًا لاستخدامك المُصَرِّف المَشْكُول. وداعاً!")
            break

if __name__ == "__main__":
    main()
