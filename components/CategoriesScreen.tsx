
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App.tsx';
import { Category } from '../types.ts';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';
import Modal from './ui/Modal.tsx';
import Select from './ui/Select.tsx'; 
import { CATEGORY_TAX_RELEVANCE_OPTIONS } from '../constants.ts'; 

interface CategoryFormProps {
  category?: Category;
  onSave: (name: string, defaultTaxRelevance: Category['defaultTaxRelevance'], id?: string) => void;
  onCancel: () => void;
  existingCategoryNames: string[]; // To check for duplicates
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSave, onCancel, existingCategoryNames }) => {
  const [name, setName] = useState(category ? category.name : '');
  const [defaultTaxRelevance, setDefaultTaxRelevance] = useState<Category['defaultTaxRelevance']>(category?.defaultTaxRelevance || 'none');
  const [error, setError] = useState('');
  const context = useContext(AppContext);


  useEffect(() => {
    setName(category ? category.name : '');
    setDefaultTaxRelevance(category?.defaultTaxRelevance || 'none');
    setError('');
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Category name cannot be empty.');
      return;
    }
    const isDuplicate = existingCategoryNames.some(
        existingName => existingName.toLowerCase() === trimmedName.toLowerCase() && (category ? category.name.toLowerCase() !== trimmedName.toLowerCase() : true)
    );
    if (isDuplicate) {
        setError('This category name already exists. Please choose a unique name.');
        return;
    }
    onSave(trimmedName, defaultTaxRelevance, category?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={category ? 'Edit Category Name' : 'New Category Name'}
        type="text"
        id="categoryName"
        value={name}
        onChange={e => { setName(e.target.value); setError(''); }}
        error={error}
        placeholder="e.g., Food, Utilities, Freelance Income"
        required
        autoFocus
      />
      <Select
        label="Default Tax Relevance"
        id="defaultTaxRelevance"
        value={defaultTaxRelevance}
        onChange={e => setDefaultTaxRelevance(e.target.value as Category['defaultTaxRelevance'])}
        options={CATEGORY_TAX_RELEVANCE_OPTIONS}
        containerClassName="mb-0"
        title="Set default tax relevance for new transactions using this category."
      />
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="light" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" leftIcon={<i className={`fas ${category ? 'fa-save' : 'fa-plus-circle'} mr-1.5`}></i>}>{category ? 'Save Changes' : 'Add Category'}</Button>
      </div>
    </form>
  );
};


const CategoriesScreen: React.FC = () => {
  const context = useContext(AppContext);
  
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  if (!context) return <div className="flex items-center justify-center min-h-screen"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i><span className="ml-3 text-lg">Loading context...</span></div>;
  const { categories, addCategory, updateCategory, deleteCategory, isLoading, notifyWarning } = context;

  const handleAddCategory = () => {
    setEditingCategory(undefined);
    setShowFormModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowFormModal(true);
  };

  const handleSaveCategory = (name: string, defaultTaxRelevance: Category['defaultTaxRelevance'], id?: string) => {
    if (id) {
      updateCategory(id, name, defaultTaxRelevance);
    } else {
      addCategory(name, defaultTaxRelevance);
    }
    setShowFormModal(false);
    setEditingCategory(undefined);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id); // deleteCategory now handles its own notifications (success/warning)
    }
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };
  
  if (isLoading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><i className="fas fa-spinner fa-spin text-3xl text-primary"></i><span className="ml-3 text-xl">Loading categories...</span></div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-dark dark:text-gray-100">Manage Categories</h2>
        <Button variant="primary" onClick={handleAddCategory} leftIcon={<i className="fas fa-plus mr-1.5"></i>}>
          Add New Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <i className="fas fa-tags text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
            <p className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-2">No Categories Defined.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Add categories to organize your transactions and budgets effectively.</p>
            <Button variant="secondary" onClick={handleAddCategory} leftIcon={<i className="fas fa-plus-circle"></i>}>
                Add Your First Category
            </Button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {categories.map(cat => (
            <li key={cat.id} className="py-3 sm:py-4 flex justify-between items-center hover:bg-gray-50/50 dark:hover:bg-gray-700/50 px-1 sm:px-2 rounded transition-colors">
              <div>
                <span className="text-md sm:text-lg text-gray-800 dark:text-gray-100 font-medium">{cat.name}</span>
                {cat.defaultTaxRelevance && cat.defaultTaxRelevance !== 'none' && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full shadow-sm ${cat.defaultTaxRelevance === 'income' ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600' : 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-700/30 dark:text-blue-300 dark:border-blue-600'}`}>
                        Tax: {cat.defaultTaxRelevance}
                    </span>
                )}
              </div>
              <div className="space-x-1 sm:space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEditCategory(cat)} title="Edit Category">
                  <i className="fas fa-edit mr-1 sm:mr-1.5"></i> Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteClick(cat)} title="Delete Category">
                   <i className="fas fa-trash mr-1 sm:mr-1.5"></i> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingCategory(undefined); }}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <CategoryForm 
          category={editingCategory}
          onSave={handleSaveCategory}
          onCancel={() => { setShowFormModal(false); setEditingCategory(undefined); }}
          existingCategoryNames={categories.map(c => c.name)}
        />
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete Category"
      >
        <p className="text-gray-700 dark:text-gray-200">Are you sure you want to delete the category: <strong className="font-semibold">{categoryToDelete?.name}</strong>?</p>
        <p className="text-sm text-red-500 dark:text-red-400 mt-1">Note: Categories used by existing transactions, budgets or recurring transactions cannot be deleted.</p>
        <div className="mt-6 flex justify-end space-x-3">
           <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
           <Button variant="danger" onClick={confirmDelete} leftIcon={<i className="fas fa-trash-alt mr-1.5"></i>}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesScreen;
