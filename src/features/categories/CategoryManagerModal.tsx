import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Category, CategoryType } from '../../types';
import { CategoryIcon, AVAILABLE_CATEGORY_ICONS, PRESET_CATEGORY_COLORS } from '../../components/ui/CategoryIcon';
import { X, Plus, Edit2, Archive, Check, AlertCircle } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: CategoryType;
  onSelectCategory?: (category: Category) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
  onSelectCategory,
}) => {
  const { categories, addCategory, updateCategory, archiveCategory } = useAppStore();
  const [activeTab, setActiveTab] = useState<CategoryType>(defaultType);
  const [isAddingOrEditing, setIsAddingOrEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Tag');
  const [selectedColor, setSelectedColor] = useState(PRESET_CATEGORY_COLORS[0]);
  const [formError, setFormError] = useState('');
  const [archivingCategory, setArchivingCategory] = useState<Category | null>(null);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === activeTab && c.isActive);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setSelectedIcon(activeTab === 'income' ? 'Briefcase' : 'ShoppingBag');
    setSelectedColor(activeTab === 'income' ? '#10B981' : '#EF4444');
    setFormError('');
    setIsAddingOrEditing(true);
  };

  const handleOpenEdit = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setName(cat.name);
    setSelectedIcon(cat.icon);
    setSelectedColor(cat.color);
    setFormError('');
    setIsAddingOrEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: trimmed,
          icon: selectedIcon,
          color: selectedColor,
        });
      } else {
        await addCategory({
          name: trimmed,
          type: activeTab,
          icon: selectedIcon,
          color: selectedColor,
          isDefault: false,
          isActive: true,
        });
      }
      setIsAddingOrEditing(false);
      setName('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save category');
    }
  };

  const handleConfirmArchive = async () => {
    if (!archivingCategory) return;
    await archiveCategory(archivingCategory.id);
    setArchivingCategory(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
              {isAddingOrEditing ? (editingCategory ? 'Edit Category' : 'New Custom Category') : 'Manage Categories'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isAddingOrEditing ? 'Custom categories help personalize your tracking' : 'Select, edit, or create custom categories'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isAddingOrEditing ? (
          <form onSubmit={handleSave} className="p-4 space-y-4 overflow-y-auto flex-1">
            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pet Supplies, Gym"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                maxLength={40}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                Select Color
              </label>
              <div className="flex flex-wrap gap-2.5">
                {PRESET_CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                      selectedColor === color ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                Select Icon
              </label>
              <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-xl">
                {AVAILABLE_CATEGORY_ICONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                      selectedIcon === iconName
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <CategoryIcon name={iconName} className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingOrEditing(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-md"
              >
                {editingCategory ? 'Update Category' : 'Save Category'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category Type Tabs */}
            <div className="px-4 pt-3 pb-2 flex gap-2 border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('expense')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'expense'
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                }`}
              >
                Expense Categories
              </button>
              <button
                onClick={() => setActiveTab('income')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'income'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                }`}
              >
                Income Categories
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => {
                    if (onSelectCategory) {
                      onSelectCategory(cat);
                      onClose();
                    }
                  }}
                  className={`group p-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between ${
                    onSelectCategory ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} color={cat.color} className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        {cat.name}
                        {cat.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-md font-semibold">
                            Default
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(cat, e)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!cat.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setArchivingCategory(cat);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Archive Category"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
              <button
                onClick={handleOpenAdd}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Category</span>
              </button>
            </div>
          </div>
        )}

        {/* Archiving Confirmation Modal Overlay */}
        {archivingCategory && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 max-w-xs text-center space-y-3 border border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-red-50 dark:bg-red-950/60 text-red-500 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                <Archive className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Archive "{archivingCategory.name}"?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This category will no longer appear for new transactions, but existing transaction history using it will remain intact.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setArchivingCategory(null)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmArchive}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700"
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
