import React, { useState, useEffect } from 'react';

interface Scheme {
  name: string;
  pattern: string;
}

interface SchemeManagerProps {
  pyodide: any;
  onSchemesUpdated: () => void;
}

const SchemeManager: React.FC<SchemeManagerProps> = ({ pyodide, onSchemesUpdated }) => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [newName, setNewName] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPattern, setEditPattern] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{index: number, name: string} | null>(null);
  const [loading, setLoading] = useState(false);

  // Load existing schemes
  const loadSchemes = async () => {
    try {
      setLoading(true);
      const schemesJson = await pyodide.runPython(`json.dumps(ht.get_all())`);
      setSchemes(JSON.parse(schemesJson));
    } catch (error) {
      console.error('Error loading schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, []);

 const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = `fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl ${
      type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const handleAddScheme = async () => {
    if (!newName.trim() || !newPattern.trim()) {
      showNotification('يرجى إدخال اسم الوزن والنمط', 'error');
      return;
    }

    // Check if scheme already exists
    if (schemes.some(s => s.name === newName)) {
      showNotification(`الوزن "${newName}" موجود بالفعل`, 'error');
      return;
    }

    try {
      await pyodide.runPython(`ht.insert("${newName}", "${newPattern}")`);
      setNewName('');
      setNewPattern('');
      await loadSchemes();
      onSchemesUpdated();
      showNotification(`تم إضافة الوزن "${newName}" بنجاح`, 'success');
    } catch (error) {
      console.error('Error adding scheme:', error);
      showNotification('حدث خطأ أثناء إضافة الوزن', 'error');
    }
  };

  const confirmDeleteScheme = async () => {
    if (!showDeleteConfirm) return;
    
    const { name } = showDeleteConfirm;
    try {
      // Method 1: Direct Python approach
      await pyodide.runPython(`
        # Get current schemes
        all_schemes = ht.get_all()
        
        # Remove the scheme by rebuilding the hash table
        ht_new = SchemeHashTable()
        for s in all_schemes:
            if s['name'] != "${name}":
                ht_new.insert(s['name'], s['pattern'])
        
        # Replace the old table
        ht.table = ht_new.table
      `);
      
      await loadSchemes();
      onSchemesUpdated();
      showNotification(`تم حذف الوزن "${name}" بنجاح`, 'success');
    } catch (error) {
      console.error('Error deleting scheme:', error);
      showNotification('حدث خطأ أثناء الحذف', 'error');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const startEditing = (index: number, scheme: Scheme) => {
    setEditingIndex(index);
    setEditName(scheme.name);
    setEditPattern(scheme.pattern);
  };

  const handleUpdateScheme = async () => {
    if (editingIndex === null || !editName.trim() || !editPattern.trim()) {
      showNotification('يرجى إدخال اسم الوزن والنمط', 'error');
      return;
    }

    const oldScheme = schemes[editingIndex];
    
    // Check if new name conflicts with existing scheme (except the one being edited)
    if (schemes.some((s, idx) => idx !== editingIndex && s.name === editName)) {
      showNotification(`الوزن "${editName}" موجود بالفعل`, 'error');
      return;
    }
    
    try {
      await pyodide.runPython(`
        # Remove old scheme
        all_schemes = ht.get_all()
        ht_new = SchemeHashTable()
        for s in all_schemes:
            if s['name'] != "${oldScheme.name}":
                ht_new.insert(s['name'], s['pattern'])
        
        # Add updated scheme
        ht_new.insert("${editName}", "${editPattern}")
        
        # Replace table
        ht.table = ht_new.table
      `);
      
      setEditingIndex(null);
      await loadSchemes();
      onSchemesUpdated();
      showNotification(`تم تحديث الوزن بنجاح`, 'success');
    } catch (error) {
      console.error('Error updating scheme:', error);
      showNotification('حدث خطأ أثناء التحديث', 'error');
    }
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditName('');
    setEditPattern('');
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 max-w-md mx-4">
            <div className="text-center">
              <span className="text-5xl text-rose-500 mb-4 block">⚠️</span>
              <h3 className="text-xl font-bold text-slate-900 mb-2">تأكيد الحذف</h3>
              <p className="text-slate-600 mb-6">
                هل أنت متأكد من حذف الوزن <span className="font-bold">"{showDeleteConfirm.name}"</span>؟
                <br />
                <span className="text-sm text-slate-500">هذا الإجراء لا يمكن التراجع عنه.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDeleteScheme}
                  className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span>🗑️</span>
                  نعم، احذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
        <span className="text-emerald-500">⚙️</span>
        إدارة الأوزان الصرفية
      </h3>

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-emerald-500 border-r-transparent"></div>
          <p className="text-slate-500 mt-2">جاري التحميل...</p>
        </div>
      )}

      {/* Add New Scheme Form */}
      <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <h4 className="text-lg font-bold text-slate-800 mb-4">إضافة وزن جديد</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              اسم الوزن (مثال: اسم فاعل)
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl arabic-font text-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="اسم الوزن"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              النمط (مثال: فَاعِل)
            </label>
            <input
              type="text"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl arabic-font text-2xl text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="فَاعِل"
            />
          </div>
        </div>
        <button
          onClick={handleAddScheme}
          className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          disabled={loading}
        >
          <span>➕</span>
          إضافة الوزن الجديد
        </button>
      </div>

      {/* Existing Schemes List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-bold text-slate-800">الأوزان الحالية</h4>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold">
            {schemes.length} وزن
          </span>
        </div>
        
        {schemes.length === 0 ? (
          <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
            <span className="text-5xl block mb-3">📭</span>
            <p className="text-lg">لا توجد أوزان مضافة بعد</p>
            <p className="text-sm mt-2">استخدم النموذج أعلاه لإضافة أوزان جديدة</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {schemes.map((scheme, index) => (
              <div 
                key={index} 
                className={`border rounded-2xl p-5 transition-all ${editingIndex === index ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:shadow-sm'}`}
              >
                {editingIndex === index ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full p-3 border border-emerald-500 rounded-xl arabic-font focus:ring-1 focus:ring-emerald-500 outline-none"
                          placeholder="اسم الوزن"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editPattern}
                          onChange={(e) => setEditPattern(e.target.value)}
                          className="w-full p-3 border border-emerald-500 rounded-xl arabic-font text-2xl text-center focus:ring-1 focus:ring-emerald-500 outline-none"
                          placeholder="فَاعِل"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateScheme}
                        className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                        disabled={loading}
                      >
                        <span>💾</span>
                        حفظ التعديلات
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-slate-900">{scheme.name}</span>
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                          الوزن
                        </span>
                      </div>
                      <div className="arabic-font text-3xl font-bold text-emerald-700">
                        {scheme.pattern}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(index, scheme)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors flex items-center gap-2"
                        title="تعديل"
                      >
                        <span>✏️</span>
                        <span className="hidden md:inline">تعديل</span>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({index, name: scheme.name})}
                        className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 transition-colors flex items-center gap-2"
                        title="حذف"
                      >
                        <span>🗑️</span>
                        <span className="hidden md:inline">حذف</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemeManager;