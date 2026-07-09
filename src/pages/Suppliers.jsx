import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Filter,
  Users, CheckCircle, Building2, Handshake, ChevronDown,
  MoreVertical, ChevronLeft, ChevronRight, MapPin, Phone,
  ArrowUp, ArrowDown,
  User2Icon
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getSuppliersApi, createSupplierApi, deleteSupplierApi, updateSupplierApi } from '../commonApi/api';
import Modal from '../components/ui/Modal';

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

  const [dashboardStats, setDashboardStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    newThisMonth: 0,
    totalPurchase: 0
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
          contactPerson: s.contactPerson || ['Mr. Ramesh Kumar', 'Ms. Meena', 'Mr. Prakash', 'Mr. S. Ranganathan', 'Ms. Nandhini'][idx % 5],
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplierApi(id);
        toast.success('Supplier deleted successfully!');
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        toast.error('Failed to delete supplier.');
      }
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
      trend: "8.5%",
      trendUp: true,
      icon: <Users className="h-5 w-5 text-blue-600" />,
      bg: "bg-blue-50",
      graph: true
    },
    {
      title: "Active Suppliers",
      value: dashboardStats.activeSuppliers.toString(),
      trend: "12.4%",
      trendUp: true,
      icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
      bg: "bg-emerald-50"
    },
    {
      title: "New This Month",
      value: dashboardStats.newThisMonth.toString(),
      trend: "4.2%",
      trendUp: true,
      icon: <Building2 className="h-5 w-5 text-purple-600" />,
      bg: "bg-purple-50"
    },
    {
      title: "Total Purchase",
      value: `₹ ${formatLakhs(dashboardStats.totalPurchase)}L`,
      trend: "3.1%",
      trendUp: false,
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
            className="flex items-center px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm cursor-pointer"
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
          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
            <div className="relative">
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="appearance-none bg-white border border-slate-200 text-slate-700 rounded-xl pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm font-semibold cursor-pointer min-w-[110px]"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={city}
                onChange={(e) => { setCity(e.target.value); setPage(1); }}
                className="appearance-none bg-white border border-slate-200 text-slate-700 rounded-xl pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm font-semibold cursor-pointer min-w-[110px]"
              >
                <option value="">All Cities</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Salem">Salem</option>
                <option value="Tiruppur">Tiruppur</option>
                <option value="Erode">Erode</option>
                <option value="Madurai">Madurai</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <button className="flex items-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-visible">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800 w-10">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800">
                  <div className="flex items-center cursor-pointer">
                    Supplier
                    <ChevronDown className="h-3 w-3 ml-1 text-slate-400" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800">
                  Contact Person
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800">
                  Phone
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800">
                  City
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[14px] font-semibold text-slate-800">
                  Last Order
                </th>
                <th scope="col" className="px-6 py-4 text-right text-[14px] font-semibold text-slate-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-sm text-slate-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-3 font-medium">Loading suppliers...</span>
                    </div>
                  </td>
                </tr>
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
                    className={`hover:bg-slate-50/80 transition-colors group relative ${openDropdownId === supplier.id ? 'z-50' : ''} hover:z-40`}
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
                          <div className="text-[14px] font-bold text-slate-900">{supplier.name}</div>
                          <div className="text-[13px] font-medium text-slate-500 mt-0.5">GSTIN: {supplier.gstin}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-[14px] font-bold text-slate-700">{supplier.contactPerson}</div>
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
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[13px] font-bold rounded-full
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
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === supplier.id ? null : supplier.id)}
                          className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {openDropdownId === supplier.id && (
                          <div className="absolute right-8 top-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-[9999] flex flex-col">
                            <button
                              onClick={() => handleEdit(supplier)}
                              className="block w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#2563EB] transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                handleDelete(supplier.id);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-between rounded-b-2xl relative">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-[14px] font-medium text-slate-500">
                Showing <span className="font-bold text-slate-700">{totalCount === 0 ? 0 : (page - 1) * limit + 1}</span> to <span className="font-bold text-slate-700">{Math.min(page * limit, totalCount)}</span> of <span className="font-bold text-slate-700">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md gap-1.5" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {[...Array(totalPages)].map((_, i) => {
                  // Only show a few pages around current page for clean UI
                  if (
                    totalPages <= 5 ||
                    i === 0 ||
                    i === totalPages - 1 ||
                    (i >= page - 2 && i <= page)
                  ) {
                    return (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`relative inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-bold transition-colors shadow-sm cursor-pointer ${page === i + 1
                          ? 'bg-[#2563EB] text-white border-transparent'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        {i + 1}
                      </button>
                    );
                  }

                  // Add ellipsis
                  if (i === 1 && page > 3) {
                    return <span key={i} className="relative inline-flex items-center justify-center h-8 w-8 text-sm font-bold text-slate-400">...</span>;
                  }
                  if (i === totalPages - 2 && page < totalPages - 2) {
                    return <span key={i} className="relative inline-flex items-center justify-center h-8 w-8 text-sm font-bold text-slate-400">...</span>;
                  }

                  return null;
                })}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
                  className="relative inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

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
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

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
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#2563EB] text-white rounded-xl hover:bg-blue-700 transition-colors text-[14px] font-bold disabled:opacity-50 cursor-pointer shadow-sm"
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
