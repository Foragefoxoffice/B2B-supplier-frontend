import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Filter,
  Users, CheckCircle, Building2, Handshake, ChevronDown,
  MoreVertical, ChevronLeft, ChevronRight, MapPin, Phone,
  ArrowUp, ArrowDown,
  User2Icon,
  Edit, Trash2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';
import { getSuppliersApi, createSupplierApi, deleteSupplierApi, updateSupplierApi } from '../commonApi/api';
import Modal from '../components/ui/Modal';
import { TableRowsSkeleton } from '../components/common/SkeletonLoader';
import SelectField from '../components/common/SelectField';
import Pagination from '../components/common/Pagination';
const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteSupplierId, setDeleteSupplierId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    newThisMonth: 0,
    totalPurchase: 0,
    trends: null
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Debounce search input to avoid hitting API on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchSuppliers();
  }, [page, limit, debouncedSearch, status, city]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setDebouncedSearch(search);
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getSuppliersApi({ page, limit, search: debouncedSearch, status, city });
      if (data.success) {
        // Encriching with mock data for visual matching if some fields are missing from API
        const colors = [
          'bg-blue-100 text-blue-700',
          'bg-orange-100 text-orange-700',
          'bg-purple-100 text-purple-700',
          'bg-emerald-100 text-emerald-700',
          'bg-yellow-100 text-yellow-700'
        ];
        const enrichedData = data.data.map((s, idx) => ({
          ...s,
          gstin: s.gstin || `33AA${Math.random().toString(36).substring(2, 8).toUpperCase()}1Z4`,
          lastOrder: s.lastOrder || `01 Jul 2025`,
          name: s.name || 'Ambigaa Silks',
          initials: s.name ? s.name.substring(0, 2).toUpperCase() : 'AM',
          colorClass: colors[idx % colors.length],
          status: s.status || (idx === 3 ? 'INACTIVE' : 'ACTIVE'), // Mock inactive for visual
          city: s.city || ['Salem', 'Coimbatore', 'Erode', 'Madurai', 'Tiruppur'][idx % 5],
          phone: s.phone || '+916383990217',
          contactPerson: s.name || 'Mr. Ramesh Kumar',
          email: s.email || 'santhoshkathirvel007@gmail.com'
        }));

        if (data.stats) {
          setDashboardStats(data.stats);
        }

        if (data.pagination) {
          setTotalCount(data.total || 0);
          setTotalPages(data.pagination.totalPages || 1);
        } else {
          setTotalCount(enrichedData.length);
          setTotalPages(1);
        }

        setSuppliers(enrichedData);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    reset({});
    setIsModalOpen(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    reset(supplier); // Populate form
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        gst: data.gst,
        pan: data.pan,
        bank_name: data.bank_name,
        account_number: data.account_number,
        ifsc_code: data.ifsc_code
      };

      if (editingSupplier) {
        await updateSupplierApi(editingSupplier.id, payload);
        toast.success('Supplier updated successfully!');
      } else {
        await createSupplierApi(payload);
        toast.success('Supplier created successfully!');
      }
      setIsModalOpen(false);
      setEditingSupplier(null);
      reset();
      fetchSuppliers(); // Refresh table
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Failed to save supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteSupplierId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteSupplierApi(deleteSupplierId);
      toast.success('Supplier deleted successfully!');
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier.');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteSupplierId(null);
    }
  };

  // Dynamic stats mapping
  const formatLakhs = (val) => {
    if (!val) return '0';
    return (val / 100000).toFixed(2);
  };

  const statsList = [
    {
      title: "Total Suppliers",
      value: dashboardStats.totalSuppliers.toString(),
      trend: dashboardStats.trends?.totalSuppliers?.value || "0%",
      trendUp: (dashboardStats.trends?.totalSuppliers?.trend || 'up') === 'up',
      icon: <Users className="h-5 w-5 text-blue-600" />,
      bg: "bg-blue-50",
      graph: true
    },
    {
      title: "Active Suppliers",
      value: dashboardStats.activeSuppliers.toString(),
      trend: dashboardStats.trends?.activeSuppliers?.value || "0%",
      trendUp: (dashboardStats.trends?.activeSuppliers?.trend || 'up') === 'up',
      icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
      bg: "bg-emerald-50"
    },
    {
      title: "New This Month",
      value: dashboardStats.newThisMonth.toString(),
      trend: dashboardStats.trends?.newThisMonth?.value || "0%",
      trendUp: (dashboardStats.trends?.newThisMonth?.trend || 'up') === 'up',
      icon: <Building2 className="h-5 w-5 text-purple-600" />,
      bg: "bg-purple-50"
    },
    {
      title: "Total Purchase",
      value: `₹ ${formatLakhs(dashboardStats.totalPurchase)}L`,
      trend: dashboardStats.trends?.totalPurchase?.value || "0%",
      trendUp: (dashboardStats.trends?.totalPurchase?.trend || 'up') === 'up',
      icon: <Handshake className="h-5 w-5 text-orange-600" />,
      bg: "bg-orange-50"
    }
  ];

  return (
    <div className="space-y-6 max-w-full font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[28px] flex items-center font-semibold text-slate-900 tracking-tight"><User2Icon className="h-6 w-6 mr-2 text-[#2563EB]" /> Suppliers</h2>
          <p className="text-[15px] text-slate-500 mt-1">Manage and view all your suppliers</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddSupplier}
            className="flex items-center px-4 py-2 bg-active-btn text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsList.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                <h3 className="text-2xl font-semibold text-slate-900 mt-0.5">{stat.value}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center text-sm">
                <span className={`flex items-center font-bold ${stat.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stat.trendUp ? <ArrowUp className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDown className="w-3.5 h-3.5 mr-0.5" />}
                  {stat.trend}
                </span>
                <span className="text-slate-400 ml-2 font-medium">vs last month</span>
              </div>
              {stat.graph && (
                <div className="text-blue-400 opacity-80">
                  <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 18C4.5 18 6 12 10 12C14 12 16 16 20 16C24 16 26 8 30 8C34 8 36 14 40 14C44 14 48 4 52 4C56 4 58 8 59 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100">
        <div className="p-4 flex flex-col md:flex-row items-center gap-4 border-b border-slate-100">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative w-full md:w-64 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all outline-none text-sm font-medium text-slate-700 placeholder-slate-400"
              placeholder="Search suppliers..."
            />
          </form>

          <div className="flex-1"></div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-stretch md:items-center">
            <SelectField
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="rounded-xl pl-4 py-2.5 text-sm font-semibold cursor-pointer min-w-[140px]"
              wrapperClassName="md:w-[160px]"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending</option>
            </SelectField>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800 w-10 min-w-[60px]">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800 min-w-[200px]">
                  <div className="flex items-center cursor-pointer">
                    Supplier
                    <ChevronDown className="h-3 w-3 ml-1 text-slate-400" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800 min-w-[180px]">
                  Contact Person
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800 min-w-[160px]">
                  Phone
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800 min-w-[140px]">
                  City
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800 min-w-[130px]">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800 min-w-[140px]">
                  Last Order
                </th>
                <th scope="col" className="px-6 py-4 text-right text-[14px] font-semibold text-slate-800 min-w-[120px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {loading ? (
                <TableRowsSkeleton columns={8} rows={8} />
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-sm text-slate-500 font-medium">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier, idx) => (
                  <tr
                    key={supplier.id || idx}
                    className={`hover:bg-slate-50/80 transition-colors group relative`}
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${supplier.colorClass}`}>
                          {supplier.initials}
                        </div>
                        <div className="ml-4">
                          <div className="text-[14px] font-semibold text-slate-900">{supplier.name?.toUpperCase()}</div>
                          <div className="text-[13px] font-medium text-slate-500 mt-0.5">GSTIN: {supplier.gstin}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-[14px] font-semibold text-slate-700">{supplier.contactPerson}</div>
                      <div className="text-[13px] font-medium text-slate-500 mt-0.5">{supplier.email}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center text-[14px] font-medium text-slate-600">
                        <Phone className="h-4 w-4 mr-2 text-blue-500" />
                        {supplier.phone}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center text-[14px] font-medium text-slate-600">
                        <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                        {supplier.city}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[13px] font-semibold rounded-full
                        ${supplier.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                          supplier.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${supplier.status === 'ACTIVE' ? 'bg-emerald-500' : supplier.status === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                        {supplier.status === 'ACTIVE' ? 'Active' : supplier.status === 'PENDING' ? 'Pending' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-[14px] font-medium text-slate-600">
                      {supplier.lastOrder}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-blue-500 hover:text-blue-700 transition-colors p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-[18px] w-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          itemsPerPage={limit}
          onItemsPerPageChange={(val) => {
            setLimit(val);
            setPage(1);
          }}
          totalItems={totalCount}
        />
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier ? "Edit Supplier" : "Add Supplier"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Info */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-semibold text-[#1a47cd]">Basic Information</h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Name / Name <span className='text-red-500'>*</span></label>
              <input
                {...register('name', { required: true })}
                onInput={(e) => e.target.value = e.target.value.toUpperCase()}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium uppercase"
                placeholder="Acme Corp"
              />
              {errors.name && <span className="text-red-500 text-xs">Name is required</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className='text-red-500'>*</span></label>
              <input
                type="email"
                {...register('email', { required: true })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                placeholder="contact@acme.com"
              />
              {errors.email && <span className="text-red-500 text-xs">Email is required</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone <span className='text-red-500'>*</span></label>
              <input
                {...register('phone', { required: true })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                placeholder="+91 98765 43210"
              />
              {errors.phone && <span className="text-red-500 text-xs">Phone is required</span>}
            </div>
            <SelectField
              label="Status"
              {...register('status')}
              className="px-3 py-2 font-medium"
            >
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="INACTIVE">Inactive</option>
            </SelectField>

            {/* Address Info */}
            <div className="md:col-span-2 mt-2">
              <h4 className="text-sm font-semibold text-[#1a47cd]">Location</h4>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address <span className='text-red-500'>*</span></label>
              <input
                {...register('address', { required: true })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                placeholder="123 Business Park"
              />
              {errors.address && <span className="text-red-500 text-xs">Address is required</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City <span className='text-red-500'>*</span></label>
              <input
                {...register('city', { required: true })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                placeholder="Coimbatore"
              />
              {errors.city && <span className="text-red-500 text-xs">City is required</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State <span className='text-red-500'>*</span></label>
              <input
                {...register('state', { required: true })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                placeholder="Tamil Nadu"
              />
              {errors.state && <span className="text-red-500 text-xs">State is required</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pincode <span className='text-red-500'>*</span></label>
              <input
                {...register('pincode', { required: true })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                placeholder="641001"
              />
              {errors.pincode && <span className="text-red-500 text-xs">Pincode is required</span>}
            </div>

            {/* Tax & Bank Info */}
            <div className="md:col-span-2 mt-2">
              <h4 className="text-sm font-semibold text-[#1a47cd]">Tax & Banking (Optional)</h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
              <input
                {...register('gst')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium uppercase"
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PAN Number</label>
              <input
                {...register('pan')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium uppercase"
                placeholder="ABCDE1234F"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
              <input
                {...register('bank_name')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                placeholder="HDFC Bank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
              <input
                {...register('account_number')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                placeholder="000000000000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">IFSC Code</label>
              <input
                {...register('ifsc_code')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium uppercase"
                placeholder="HDFC0001234"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#2563EB] text-white rounded-xl hover:bg-blue-700 transition-colors text-[14px] font-medium disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Saving...' : (editingSupplier ? 'Update Supplier' : 'Save Supplier')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Suppliers;
