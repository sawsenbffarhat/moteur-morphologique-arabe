import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TreeVisualizer from './components/TreeVisualizer';
import SchemeManager from './components/SchemeManager';
import Toast from './components/Toast';

const App: React.FC = () => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeView, setActiveView] = useState('GENERATOR');
  const [bstData, setBstData] = useState<any>(null);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [selectedRoot, setSelectedRoot] = useState<string>('كتب');
  const [isDefinite, setIsDefinite] = useState(false);
  const [allRoots, setAllRoots] = useState<string[]>([]);
  
  const [genScheme, setGenScheme] = useState('');
  const [genResult, setGenResult] = useState('');
  const [valWord, setValWord] = useState('');
  const [valRoot, setValRoot] = useState('');
  const [valResult, setValResult] = useState<any>(null);
  const [hashStructure, setHashStructure] = useState<any[][]>([]);
  const [schemesRefresh, setSchemesRefresh] = useState(0);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  // Function to read .txt files dynamically
  const readTxtFile = async (filename: string): Promise<string[]> => {
    try {
      const response = await fetch(`/${filename}`);
      if (!response.ok) {
        console.warn(`File ${filename} not found, using default data`);
        return [];
      }
      const text = await response.text();
      return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return [];
    }
  };

  // Function to read derives.txt
  const readDerivesFile = async (): Promise<Record<string, string[]>> => {
    try {
      const response = await fetch('/derives.txt');
      if (!response.ok) return {};
      const text = await response.text();
      const result: Record<string, string[]> = {};
      
      text.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed) {
          const parts = trimmed.split(',');
          if (parts.length >= 2) {
            const root = parts[0].trim();
            const derivatives = parts.slice(1).map(d => d.trim());
            result[root] = derivatives;
          }
        }
      });
      return result;
    } catch (error) {
      console.error('Error reading derives.txt:', error);
      return {};
    }
  };

  // Toast helper function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const initPython = useCallback(async () => {
    try {
      const py = await (window as any).loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
      });

      // Load Python code from .py files in public folder
      const bstCode = await fetch('/logic_bst.py').then(r => r.text());
      const hashCode = await fetch('/logic_hash.py').then(r => r.text());
      const engineCode = await fetch('/logic_engine.py').then(r => r.text());

      await py.runPythonAsync(bstCode);
      await py.runPythonAsync(hashCode);
      await py.runPythonAsync(engineCode);

      // Initialize Python objects
      await py.runPythonAsync(`
        import json
        bst = ArabicBST()
        ht = SchemeHashTable()
        engine = MorphEngine()
      `);

      // Read roots from racines.txt
      const roots = await readTxtFile('racines.txt');
      const derivesData = await readDerivesFile();
      
      // Add default roots if file is empty
      const defaultRoots = ['كتب', 'درس', 'عمل', 'قرأ', 'خرج', 'دخل', 'علم', 'فهم', 'نصر', 'رسم'];
      const rootsToAdd = roots.length > 0 ? roots : defaultRoots;
      
      // Add each root with its derivatives (if any)
      for (const root of rootsToAdd) {
        const derivatives = derivesData[root];
        if (derivatives && derivatives.length > 0) {
          const derivativesObj = derivatives.map((word, index) => ({
            word: word,
            pattern: index === 0 ? "اسم فاعل" : index === 1 ? "اسم مفعول" : "مصدر"
          }));
          await py.runPythonAsync(`
            bst.insert("${root}", ${JSON.stringify(derivativesObj)})
          `);
        } else {
          await py.runPythonAsync(`bst.insert("${root}")`);
        }
      }

      // Add default schemes
      const initialSchemes = [
        ["اسم فاعل", "فَاعِل"],
        ["اسم مفعول", "مَفْعُول"],
        ["المصدر", "اِفْتِعَال"],
        ["الماضي", "فَعَلَ"],
        ["المضارع", "يَفْعَلُ"],
        ["اسم المكان", "مَفْعَل"],
        ["الطلب", "اِسْتِفْعَال"]
      ];

      for (const [name, pattern] of initialSchemes) {
        await py.runPythonAsync(`ht.insert("${name}", "${pattern}")`);
      }

      setPyodide(py);
      setIsLoaded(true);
      await syncData(py);
      
    } catch (err) {
      console.error("Python initialization failed", err);
      showToast("فشل تحميل محرك Python", "error");
    }
  }, []);

  const syncData = async (pyInstance: any) => {
    const py = pyInstance || pyodide;
    try {
      const bstJson = await py.runPython(`json.dumps(bst.to_dict())`);
      const schemesJson = await py.runPython(`json.dumps(ht.get_all())`);
      const hashJson = await py.runPython(`json.dumps(ht.get_full_structure())`);
      
      setBstData(JSON.parse(bstJson));
      setSchemes(JSON.parse(schemesJson));
      setHashStructure(JSON.parse(hashJson));
      
      // Update roots list from BST
      const roots: string[] = [];
      const traverse = (node: any) => {
        if (!node) return;
        traverse(node.left);
        roots.push(node.root);
        traverse(node.right);
      };
      traverse(JSON.parse(bstJson));
      setAllRoots(roots);
      
      if (roots.length > 0 && !roots.includes(selectedRoot)) {
        setSelectedRoot(roots[0]);
      }
    } catch (error) {
      console.error("Sync error:", error);
      showToast("خطأ في مزامنة البيانات", "error");
    }
  };

  const handleSchemesUpdated = () => {
    setSchemesRefresh(prev => prev + 1);
    syncData(pyodide);
  };

  useEffect(() => {
    initPython();
  }, []);

  const handleAddRoot = async () => {
    const input = document.getElementById('newRootInput') as HTMLInputElement;
    const root = input.value.trim();
    
    // Validate Arabic trilateral root
    const arabicRegex = /^[\u0621-\u064A]{3}$/;
    if (!arabicRegex.test(root)) {
      showToast('الرجاء إدخال جذر عربي ثلاثي صحيح (3 أحرف فقط)', 'error');
      return;
    }
    
    if (root.length === 3) {
      try {
        // Check if root already exists
        const existingRoots = allRoots.map(r => r.trim());
        if (existingRoots.includes(root)) {
          showToast(`الجذر "${root}" موجود بالفعل`, 'error');
          return;
        }
        
        // Add to Python BST
        await pyodide.runPython(`bst.insert("${root}")`);
        
        input.value = '';
        await syncData(pyodide);
        
        showToast(`تم إضافة الجذر "${root}" بنجاح`, 'success');
      } catch (error) {
        console.error('Error adding root:', error);
        showToast('حدث خطأ أثناء إضافة الجذر', 'error');
      }
    }
  };

  const handleGenerate = async () => {
    if (!selectedRoot || !genScheme) {
      showToast('يرجى اختيار الجذر والوزن', 'error');
      return;
    }
    
    try {
      const result = await pyodide.runPython(`engine.apply_scheme("${selectedRoot}", "${genScheme}", ${isDefinite ? 'True' : 'False'})`);
      setGenResult(result);
      
      const schemeObj = schemes.find(s => s.pattern === genScheme);
      const schemeName = schemeObj ? schemeObj.name : genScheme;
      
      // Add the generated word to BST derivatives
      await pyodide.runPython(`
        bst.insert("${selectedRoot}", [{"word": "${result}", "pattern": "${schemeName}"}])
      `);
      
      await syncData(pyodide);
      showToast(`تم توليد الكلمة "${result}" بنجاح`, 'success');
    } catch (error) {
      console.error('Error generating word:', error);
      showToast('حدث خطأ أثناء توليد الكلمة', 'error');
    }
  };

  const handleValidate = async () => {
  if (!valWord.trim() || !valRoot.trim()) {
    showToast('يرجى إدخال الكلمة والجذر', 'error');
    return;
  }
  
  try {
    // First, get all schemes from Python
    const schemesJson = await pyodide.runPython(`json.dumps(ht.get_all())`);
    const allSchemes = JSON.parse(schemesJson);
    
    console.log("Validating:", valWord, valRoot);
    console.log("Available schemes:", allSchemes);
    
    const res = await pyodide.runPython(`
      schemes = ${JSON.stringify(allSchemes)}
      result = engine.validate("${valWord}", "${valRoot}", schemes, bst)
      json.dumps({"isValid": result[0], "scheme": result[1]})
    `);
    
    const parsed = JSON.parse(res);
    setValResult(parsed);
    
    if (parsed.isValid) {
      await syncData(pyodide);
      showToast(`الكلمة "${valWord}" تنتمي للجذر "${valRoot}"`, 'success');
    } else {
      showToast(`الكلمة "${valWord}" لا تنتمي للجذر "${valRoot}"`, 'error');
    }
  } catch (error) {
    console.error('Validation error:', error);
    showToast('حدث خطأ أثناء التحليل', 'error');
  }
};
  const rootsList = useMemo(() => allRoots, [allRoots]);

  const selectedNodeData = useMemo(() => {
    const find = (node: any): any => {
      if (!node) return null;
      if (node.root === selectedRoot) return node;
      return find(node.left) || find(node.right);
    };
    return find(bstData);
  }, [bstData, selectedRoot]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="loader rounded-full border-4 border-t-4 border-emerald-500 h-16 w-16 mb-6"></div>
        <h2 className="text-2xl font-bold arabic-font tracking-wide">تجري معالجة القواعد الصرفية المشكولة...</h2>
        <p className="text-slate-500 mt-2 font-mono text-xs uppercase tracking-widest">Initialising Vocalized Engine</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#fdfdfd] text-slate-900">
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col sticky top-0 h-screen text-slate-300">
        <div className="p-8 border-b border-slate-800">
          <h1 className="text-3xl font-bold arabic-font text-white mb-2">المُصَرِّف المشكول</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">Vocalized v3.0</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          {[
            { id: 'GENERATOR', label: 'توليد مشكول', icon: '⚙️' },
            { id: 'SCHEMES', label: 'إدارة الأوزان', icon: '⚙️' },
            { id: 'TREE', label: 'هيكل الجذور', icon: '🌳' },
            { id: 'HASH', label: 'جدول الهاش', icon: '#️⃣' },
            { id: 'VALIDATOR', label: 'تحليل كلمة', icon: '🔍' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center p-4 rounded-2xl transition-all duration-300 ${activeView === item.id ? 'bg-emerald-600 text-white shadow-lg translate-x-1' : 'hover:bg-slate-800'}`}
            >
              <span className="ml-4 text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-slate-800">
          <div className="bg-slate-800/40 p-5 rounded-3xl border border-slate-700">
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-3">إضافة جذر جديد</label>
            <div className="flex gap-2">
              <input 
                id="newRootInput" 
                maxLength={3} 
                className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-center arabic-font text-xl w-16 text-white outline-none focus:ring-1 focus:ring-emerald-500" 
                placeholder="..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddRoot();
                  }
                }}
              />
              <button 
                onClick={handleAddRoot} 
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>➕</span>
                إضافة
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center px-10 justify-between shrink-0">
          <div className="flex items-center gap-6 overflow-hidden">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">تصفح الجذور:</span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {rootsList.map(r => (
                <button 
                  key={r}
                  onClick={() => setSelectedRoot(r)}
                  className={`px-5 py-1.5 rounded-full arabic-font text-lg font-bold transition-all whitespace-nowrap ${selectedRoot === r ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100 ml-4 shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">الجذر النشط</p>
            <p className="text-2xl arabic-font font-bold text-slate-900">{selectedRoot}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 bg-[#f9fafb]">
          {activeView === 'GENERATOR' && (
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">المولّد الصرفي المَشْكُول</h2>
                <p className="text-slate-500">توليد الاشتقاقات مع الحركات الكاملة.</p>
              </div>

              <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 relative">
                <div className="space-y-10">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center px-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">اختر النَّمَط (الوَزْن)</label>
                      <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                         <span className="text-xs font-bold text-slate-500">إضافة "ال" التعريف</span>
                         <button 
                          onClick={() => setIsDefinite(!isDefinite)}
                          className={`w-10 h-6 rounded-full transition-all relative ${isDefinite ? 'bg-emerald-500' : 'bg-slate-300'}`}
                         >
                           <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDefinite ? 'left-5' : 'left-1'}`}></div>
                         </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                      {schemes.map(s => (
                        <button 
                          key={s.name}
                          onClick={() => setGenScheme(s.pattern)}
                          className={`group p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center gap-1 ${genScheme === s.pattern ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl scale-105' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100 hover:scale-[1.02]'}`}
                        >
                          <span className={`text-[10px] uppercase font-bold opacity-60 ${genScheme === s.pattern ? 'text-white' : 'text-slate-500'}`}>{s.name}</span>
                          <span className="arabic-font text-3xl font-bold leading-relaxed">{s.pattern}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerate}
                    disabled={!genScheme}
                    className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-bold text-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3"
                  >
                    <span>✨</span>
                    توليد الاشتقاق المشكول
                  </button>
                </div>

                {genResult && (
                  <div className="mt-12 p-10 bg-emerald-50 rounded-[3rem] border-2 border-emerald-100 text-center animate-in zoom-in duration-500">
                    <p className="text-xs font-bold text-emerald-600 uppercase mb-3 tracking-[0.4em]">الاشتقاق النهائي</p>
                    <span className="text-9xl arabic-font font-bold text-slate-900 leading-[1.2]">{genResult}</span>
                    <div className="mt-8 flex justify-center gap-8 text-xs font-bold uppercase text-slate-400">
                       <div className="text-center">
                         <p className="mb-1">الجذر</p>
                         <p className="arabic-font text-xl text-slate-900 font-bold">{selectedRoot}</p>
                       </div>
                       <div className="w-px h-8 bg-emerald-200"></div>
                       <div className="text-center">
                         <p className="mb-1">الوزن</p>
                         <p className="arabic-font text-xl text-slate-900 font-bold">{genScheme}</p>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'SCHEMES' && (
            <div className="max-w-5xl mx-auto">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold text-slate-900">إدارة الأوزان الصرفية</h2>
                <p className="text-slate-500">أضف، عدّل، أو احذف الأوزان بشكل ديناميكي</p>
              </div>
              
              <SchemeManager 
                pyodide={pyodide} 
                onSchemesUpdated={handleSchemesUpdated}
                key={schemesRefresh}
              />
              
              {/* Current Hash Table Visualization */}
              <div className="mt-10 bg-slate-900 rounded-[2.5rem] p-8 text-white">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="text-emerald-500">#️⃣</span>
                  جدول الهاش الحالي
                </h4>
                <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
                  {hashStructure.map((bucket, i) => (
                    <div 
                      key={i}
                      className={`h-12 rounded-lg flex items-center justify-center relative ${
                        bucket.length > 0 
                          ? 'bg-emerald-500' 
                          : 'bg-slate-800'
                      }`}
                      title={`الخلية ${i}: ${bucket.length} عنصر`}
                    >
                      <span className="text-xs font-mono">{i}</span>
                      {bucket.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-[8px] px-1 rounded-full">
                          {bucket.length}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-slate-400">
                  <p>• الخلايا الخضراء تحتوي على أوزان</p>
                  <p>• الخلايا الداكنة فارغة</p>
                  <p>• الرقم الأحمر يشير إلى عدد التصادمات في الخلية</p>
                </div>
              </div>
            </div>
          )}

          {activeView === 'TREE' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-[600px]">
              <div className="lg:col-span-2 bg-white rounded-[3.5rem] p-10 shadow-sm border border-slate-100 relative flex flex-col">
                <div className="flex justify-between items-center mb-8 shrink-0">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <span className="text-emerald-500">🌳</span>
                    هيكل الجذور والاشتقاقات
                  </h3>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Interactive Knowledge Tree
                  </div>
                </div>
                <div className="flex-1 relative overflow-hidden">
                  <TreeVisualizer root={bstData} selectedRoot={selectedRoot} onNodeClick={(n) => setSelectedRoot(n.root)} />
                </div>
              </div>

              <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl overflow-y-auto max-h-full scroll-smooth transition-all duration-500 flex flex-col">
                <div className="mb-10 text-center shrink-0">
                   <div className="w-20 h-20 bg-emerald-500 rounded-3xl mx-auto flex items-center justify-center text-4xl font-bold arabic-font shadow-lg shadow-emerald-500/20 mb-4 transition-transform hover:scale-110">
                     {selectedRoot}
                   </div>
                   <h4 className="text-2xl font-bold arabic-font">الجذر: {selectedRoot}</h4>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <h5 className="text-sm font-bold text-slate-400 uppercase tracking-widest">قائمة الاشتقاقات</h5>
                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold">
                      {selectedNodeData?.derivatives?.length || 0}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedNodeData?.derivatives && selectedNodeData.derivatives.length > 0 ? (
                      selectedNodeData.derivatives.map((d: any, idx: number) => (
                        <div key={idx} className="bg-white/5 border border-white/5 rounded-3xl p-5 hover:bg-white/10 hover:border-white/10 transition-all group">
                          <div className="flex justify-between items-center mb-1">
                            <span className="arabic-font text-4xl font-bold text-emerald-400 leading-normal">{d.word}</span>
                            <span className="bg-slate-800 px-2 py-1 rounded-lg text-[8px] font-bold text-slate-500 uppercase">{d.pattern}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-20 opacity-30">
                        <span className="text-5xl block mb-4">📭</span>
                        <p className="text-sm">لا توجد اشتقاقات محفوظة.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'HASH' && (
            <div className="max-w-6xl mx-auto">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold text-slate-900">جدول الهاش (Hash Table)</h2>
                <p className="text-slate-500">تخزين الأوزان الصرفية بسرعة بحث O(1)</p>
              </div>
              
              <div className="bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl text-white">
                <div className="mb-10 flex justify-between items-end border-b border-slate-800 pb-6">
                  <div>
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">دالة الهاش</p>
                    <code className="bg-slate-950 p-3 rounded-lg text-emerald-400 font-mono text-sm block border border-slate-800">hash(key) = sum(ord(char)) % 31</code>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">حجم الجدول</p>
                    <p className="text-3xl font-bold text-white">31 خلية</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {hashStructure.map((bucket, i) => {
                    const isOccupied = bucket.length > 0;
                    const collisionCount = bucket.length > 1 ? bucket.length : 0;
                    
                    return (
                      <div 
                        key={i}
                        className={`hash-slot flex items-center justify-center h-16 rounded-xl border border-slate-800 cursor-pointer relative ${isOccupied ? 'hash-occupied bg-emerald-500' : 'bg-slate-950/30 text-slate-700'}`}
                        onClick={() => {
                          const detailPanel = document.getElementById('hash-detail-panel');
                          const detailContent = document.getElementById('hash-detail-content');
                          const indexDisplay = document.getElementById('hash-detail-index');
                          
                          if (detailPanel && detailContent && indexDisplay) {
                            indexDisplay.textContent = i.toString();
                            detailPanel.classList.remove('hidden');
                            
                            if (bucket.length === 0) {
                              detailContent.innerHTML = '<p class="text-slate-500 italic text-sm">هذه الخلية فارغة حالياً.</p>';
                            } else {
                              detailContent.innerHTML = bucket.map(item => `
                                <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center mb-2">
                                  <div>
                                    <p class="text-xs font-bold text-emerald-400 uppercase mb-1">الاسم</p>
                                    <p class="arabic-font text-xl">${item.name}</p>
                                  </div>
                                  <div class="text-left">
                                    <p class="text-xs font-bold text-slate-500 uppercase mb-1">الوزن</p>
                                    <p class="arabic-font text-xl text-white">${item.pattern}</p>
                                  </div>
                                </div>
                              `).join('');
                            }
                          }
                        }}
                      >
                        <span className="text-xs font-mono">{i}</span>
                        {collisionCount > 1 && (
                          <span className="absolute -top-1 -right-1 bg-rose-500 text-[8px] px-1 rounded-full">{collisionCount}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div id="hash-detail-panel" className="mt-12 bg-slate-950/50 border border-slate-800 rounded-[2.5rem] p-8 hidden">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    تفاصيل الخلية رقم: <span id="hash-detail-index">0</span>
                  </h4>
                  <div id="hash-detail-content" className="space-y-4"></div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'VALIDATOR' && (
            <div className="max-w-4xl mx-auto">
               <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                  <h3 className="text-2xl font-bold mb-10 text-center">المحلل الصرفي الذكي</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mr-2">الكلمة</label>
                      <input 
                        value={valWord} 
                        onChange={e => setValWord(e.target.value)} 
                        placeholder="مثلاً: كَاتِب"
                        className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-[2rem] arabic-font text-3xl outline-none text-center" 
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleValidate();
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mr-2">الجذر الثلاثي</label>
                      <input 
                        value={valRoot} 
                        onChange={e => setValRoot(e.target.value)} 
                        maxLength={3}
                        placeholder="كتب"
                        className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-[2rem] arabic-font text-3xl outline-none text-center" 
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleValidate();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleValidate} 
                    className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-bold text-xl shadow-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-3"
                  >
                    <span>🔍</span>
                    تحليل الكلمة
                  </button>
                  {valResult && (
                    <div className={`mt-10 p-8 rounded-[2.5rem] border-2 flex items-center gap-6 ${valResult.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <span className="text-5xl">{valResult.isValid ? '✅' : '❌'}</span>
                      <div>
                        <p className="font-bold text-lg">{valResult.isValid ? 'توافق صرفي ناجح' : 'فشل التحليل'}</p>
                        {valResult.isValid && valResult.scheme && (
                          <p className="text-slate-600">
                            الكلمة تتبع وزن: <span className="font-bold arabic-font text-xl">{valResult.scheme.pattern}</span> ({valResult.scheme.name})
                          </p>
                        )}
                      </div>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;