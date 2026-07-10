import React, { useState, useEffect } from 'react';
import { getTransportersApi, createTransporterApi, updateTransporterApi, deleteTransporterApi } from '../commonApi/api';
import toast from 'react-hot-toast';
import { Truck, Plus, Edit2, Trash2, X } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';

const Transporters = () => {
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', contact: '', address: '' });
  const [deleteTransporterId, setDeleteTransporterId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchTransporters = async () => {
    try {
      setLoading(true);
      const res = await getTransportersApi();
      if (res.success) {
        setTransporters(res.data);
      }
    } catch (error) {
      toast.error('Failed to fetch transporters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransporters();
  }, []);

  const handleOpenModal = (transporter = null) => {
    if (transporter) {
      setFormData({
        id: transporter.id,
        name: transporter.name,
        contact: transporter.contact || '',
        address: transporter.address || ''
      });
    } else {
      setFormData({ id: null, name: '', contact: '', address: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateTransporterApi(formData.id, formData);
        toast.success('Transporter updated successfully');
      } else {
        await createTransporterApi(formData);
        toast.success('Transporter added successfully');
      }
      setShowModal(false);
      fetchTransporters();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save transporter');
    }
  };

  const handleDelete = (id) => {
    setDeleteTransporterId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteTransporterApi(deleteTransporterId);
      toast.success('Transporter deleted successfully');
      fetchTransporters();
    } catch (error) {
      toast.error('Failed to delete transporter');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTransporterId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy-dark">Transporters</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your delivery partners and transporters.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Transporter
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-6 w-6 text-blue-600 rounded-full border-2 border-slate-200 border-t-blue-600"></div>
          </div>
        ) : transporters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <Truck className="w-12 h-12 text-slate-300 mb-3" />
            <p>No transporters found. Add one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
                  <th className="py-4 px-6 font-semibold">Name</th>
                  <th className="py-4 px-6 font-semibold">Contact</th>
                  <th className="py-4 px-6 font-semibold">Address</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transporters.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-semibold text-slate-800">{t.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">{t.contact || '-'}</td>
                    <td className="py-4 px-6 text-sm text-slate-600 truncate max-w-[200px]" title={t.address}>{t.address || '-'}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(t)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-semibold text-navy-dark text-lg">
                {formData.id ? 'Edit Transporter' : 'Add Transporter'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Transporter Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="e.g. VRL Logistics"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Details</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="Phone or email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address / Remarks</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                  placeholder="Additional details..."
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {formData.id ? 'Save Changes' : 'Add Transporter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Transporter"
        message="Are you sure you want to delete this transporter? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default Transporters;
