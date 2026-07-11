import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, WalletCards } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';
import { getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi } from '../commonApi/api';
import Modal from '../components/ui/Modal';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

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
        await updateCategoryApi(editingCategory.id, {
          name: data.name,
          category_code: data.category_code || ''
        });
        toast.success('Category updated successfully!');
      } else {
        await createCategoryApi({
          name: data.name,
          category_code: data.category_code || ''
        });
        toast.success('Category created successfully!');
      }
      setIsModalOpen(false);
      reset();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    reset({ name: '', category_code: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    reset({
      name: category.name,
      category_code: category.category_code || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setDeleteCategoryId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteCategoryApi(deleteCategoryId);
      toast.success('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category.');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteCategoryId(null);
    }
  };

  // Pagination Calculations
  const totalItems = categories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = categories.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2"> <WalletCards className='text-[#2563EB]' />Categories</h2>
          <p className="text-sm text-slate-500 mt-1">Organize your product hierarchy</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-active-btn text-white rounded-xl hover:opacity-90 transition-colors font-semibold shadow-sm cursor-pointer text-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-20 text-slate-500 font-medium">Loading categories...</div>
          ) : paginatedCategories.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-medium">No categories found. Click Add Category to create one.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-600 text-sm font-semibold">
                  <th className="py-4 px-6 font-semibold text-slate-600 w-44">Code</th>
                  <th className="py-4 px-6 font-semibold text-slate-600">Category Name</th>
                  <th className="py-4 px-6 text-right font-semibold text-slate-600 w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-6">
                      <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                        {category.category_code || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800 text-sm">
                      {category.name}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEditModal(category)}
                          className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && totalItems > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-slate-100 gap-4 bg-slate-50/20 text-sm">
            <div className="text-slate-500 font-medium flex flex-wrap items-center gap-2">
              <span>Showing <span className="text-slate-800 font-bold">{startIndex + 1}</span> to{' '}
                <span className="text-slate-800 font-bold">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of{' '}
                <span className="text-slate-800 font-bold">{totalItems}</span> categories</span>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-200 rounded-lg px-2 py-0.5 text-xs bg-white outline-none cursor-pointer font-bold text-slate-700"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-600 transition-colors"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
                      ? 'bg-active-btn text-white shadow-sm border-0'
                      : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-600 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? "Edit Category" : "Add Category"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Category Code *</label>
            <input
              {...register('category_code', { required: true })}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-slate-800 text-sm bg-slate-50 hover:bg-slate-100/50"
              placeholder="e.g. P530"
            />
            {errors.category_code && <span className="text-red-500 text-xs mt-1 block">Category Code is required</span>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Category Name *</label>
            <input
              {...register('name', { required: true })}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-slate-800 text-sm bg-slate-50 hover:bg-slate-100/50"
              placeholder="e.g. Multi Color Checkd"
            />
            {errors.name && <span className="text-red-500 text-xs mt-1 block">Category Name is required</span>}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-active-btn hover:opacity-90 text-white rounded-xl transition-all font-semibold text-sm disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default Categories;
