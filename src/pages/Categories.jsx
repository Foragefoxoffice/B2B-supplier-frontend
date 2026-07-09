import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { getCategoriesApi, createCategoryApi, deleteCategoryApi } from '../commonApi/api';
import Modal from '../components/ui/Modal';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategoriesApi();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await updateCategoryApi(editingCategory.id, data);
      } else {
        await createCategoryApi(data);
      }
      setIsModalOpen(false);
      reset();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    reset({ name: '', parent_id: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    reset({ name: category.name, parent_id: category.parent_id || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategoryApi(id);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Categories</h2>
          <p className="text-sm text-slate-500 mt-1">Organize your product hierarchy</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-active-btn text-white rounded-lg hover:opacity-90 transition-colors font-medium shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center text-blue-800 font-bold mb-4">
          <FolderTree className="h-5 w-5 mr-2" />
          Product Taxonomy
        </div>
        
        <div className="space-y-2">
          {loading ? (
            <div className="text-center text-slate-500 py-4">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center text-slate-500 py-4">No categories found.</div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="flex justify-between items-center">
                  <div className="flex items-center font-semibold text-slate-800">
                    <ChevronRight className="h-4 w-4 mr-1 text-slate-400" />
                    {category.name}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => openEditModal(category)} className="text-blue-500 hover:text-blue-700"><Edit2 className="h-4 w-4" /></button>
                    <button 
                      onClick={() => handleDelete(category.id)}
                      className="text-red-500 hover:text-red-700"
                    ><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                
                {category.children && category.children.length > 0 && (
                  <div className="ml-6 mt-2 border-l-2 border-slate-100 pl-4 space-y-2">
                    {category.children.map(child => (
                      <div key={child.id} className="flex justify-between items-center p-2 rounded hover:bg-slate-100 group/sub">
                        <span className="text-slate-600 text-sm">{child.name}</span>
                        <div className="opacity-0 group-hover/sub:opacity-100 transition-opacity flex gap-2">
                          <button onClick={() => openEditModal(child)} className="text-blue-500 hover:text-blue-700"><Edit2 className="h-3 w-3" /></button>
                          <button 
                            onClick={() => handleDelete(child.id)}
                            className="text-red-500 hover:text-red-700"
                          ><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? "Edit Category" : "Add Category"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
            <input 
              {...register('name', { required: true })} 
              className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" 
              placeholder="e.g. Electronics" 
            />
            {errors.name && <span className="text-red-500 text-xs">Name is required</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category (Optional)</label>
            <select 
              {...register('parent_id')} 
              className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- No Parent (Root Category) --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-active-btn text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;
