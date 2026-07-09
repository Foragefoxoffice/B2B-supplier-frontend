import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { getProductsApi, createProductApi, approveProductApi, deleteProductApi, getSuppliersApi, getCategoriesApi, createOrderApi } from '../commonApi/api';
import Modal from '../components/ui/Modal';

const Products = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderRemarks, setOrderRemarks] = useState('');
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userSupplierId, setUserSupplierId] = useState(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const parsedUser = JSON.parse(userString);
      setUserRole(parsedUser.role);
      setUserSupplierId(parsedUser.supplier_id);
    }
    
    fetchProducts();
    fetchSuppliersAndCategories();
  }, []);

  const fetchSuppliersAndCategories = async () => {
    try {
      const catData = await getCategoriesApi();
      if (catData.success) setCategories(catData.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }

    const userString = localStorage.getItem('user');
    const parsedUser = userString ? JSON.parse(userString) : null;
    
    if (parsedUser && parsedUser.role !== 'SUPPLIER') {
      try {
        const supData = await getSuppliersApi();
        if (supData.success) setSuppliers(supData.data);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProductsApi();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', data.price);
      formData.append('moq', data.moq);
      formData.append('unit', data.unit);
      formData.append('supplier_id', data.supplier_id);
      formData.append('category_id', data.category_id);
      
      if (data.images && data.images.length > 0) {
        for (let i = 0; i < data.images.length; i++) {
          formData.append('images', data.images[i]);
        }
      }

      await createProductApi(formData);
      setIsModalOpen(false);
      reset();
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to upload product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePurchaseClick = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(product.moq || 1);
    setOrderRemarks('');
    setIsOrderModalOpen(true);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setIsSubmitting(true);
      const data = await createOrderApi({
        product_id: selectedProduct.id,
        quantity: orderQuantity,
        rate: selectedProduct.price,
        remarks: orderRemarks
      });
      
      if (data.success) {
        setIsOrderModalOpen(false);
        // Also automatically approve the product if it's currently PENDING
        if (selectedProduct.status === 'PENDING') {
          await approveProductApi(selectedProduct.id, 'APPROVED');
        }
        alert('Purchase Order created successfully!');
        fetchProducts();
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProductApi(id);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await approveProductApi(id, status);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {userRole === 'SUPPLIER' ? 'My Products' : 'Products'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {userRole === 'SUPPLIER' ? 'Manage your uploaded designs' : 'Review and manage supplier product catalog'}
          </p>
        </div>
        {userRole === 'SUPPLIER' && (
          <button 
            onClick={() => { reset(); setIsModalOpen(true); }}
            className="flex items-center px-4 py-2 bg-active-btn text-white rounded-lg hover:opacity-90 transition-colors font-medium shadow-sm"
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            Upload Products
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-8 text-slate-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-slate-500">No products found.</div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-slate-100 flex items-center justify-center relative">
                {product.images && product.images.length > 0 ? (
                  <img src={`http://localhost:5000${product.images[0].url}`} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-slate-400">No Image</span>
                )}
                <div className="absolute top-2 right-2 flex items-center">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    product.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    product.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.status}
                  </span>
                  
                  {userRole === 'SUPPLIER' && (
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="ml-2 bg-white/80 backdrop-blur text-red-600 p-1 rounded-full hover:bg-white transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-5">
                <div className="text-xs text-slate-500 font-semibold mb-1">
                  {product.supplier?.name} • {product.category?.name}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 truncate" title={product.name}>{product.name}</h3>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-blue-600">${parseFloat(product.price).toFixed(2)}</span>
                  <span className="text-sm text-slate-500">MOQ: {product.moq} {product.unit}</span>
                </div>
                
                {product.status === 'PENDING' && userRole !== 'SUPPLIER' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePurchaseClick(product)}
                      className="flex-1 flex justify-center items-center py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" /> Purchase
                    </button>
                    <button 
                      onClick={() => handleApprove(product.id, 'REJECTED')}
                      className="flex-1 flex justify-center items-center py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm">
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </button>
                  </div>
                )}
                {product.status === 'APPROVED' && userRole !== 'SUPPLIER' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePurchaseClick(product)}
                      className="flex-1 flex justify-center items-center py-2 bg-active-btn text-white border-0 rounded-lg hover:opacity-90 transition-colors font-medium text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" /> Buy Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Product">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
            <input 
              {...register('name', { required: true })} 
              className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" 
              placeholder="e.g. Industrial Router AC1200" 
            />
            {errors.name && <span className="text-red-500 text-xs">Name is required</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea 
              {...register('description')} 
              className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 h-24 resize-none" 
              placeholder="Product details..." 
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userRole !== 'SUPPLIER' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                <select 
                  {...register('supplier_id', { required: userRole !== 'SUPPLIER' })} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={userRole === 'SUPPLIER' ? 'col-span-2' : ''}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                {...register('category_id', { required: true })} 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">-- Select Category --</option>
                {categories.map(c => (
                  <optgroup key={c.id} label={c.name}>
                    <option value={c.id}>{c.name}</option>
                    {c.children && c.children.map(child => (
                      <option key={child.id} value={child.id}>-- {child.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
              <input 
                type="number"
                step="0.01"
                {...register('price', { required: true })} 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">MOQ</label>
              <input 
                type="number"
                {...register('moq', { required: true })} 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
              <input 
                {...register('unit', { required: true })} 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" 
                placeholder="pcs, kg, etc" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Images</label>
            <input 
              type="file"
              multiple
              accept="image/*"
              {...register('images')} 
              className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
            />
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
              {isSubmitting ? 'Uploading...' : 'Upload Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Order Modal */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Create Purchase Order">
        {selectedProduct && (
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg mb-4">
              <h4 className="font-bold text-slate-800">{selectedProduct.name}</h4>
              <p className="text-sm text-slate-500">Price: ${parseFloat(selectedProduct.price).toFixed(2)} / {selectedProduct.unit}</p>
              <p className="text-sm text-slate-500">MOQ: {selectedProduct.moq}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Order Quantity</label>
              <input 
                type="number" 
                min={selectedProduct.moq}
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" 
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Total Amount: ${(orderQuantity * parseFloat(selectedProduct.price)).toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Remarks (Optional)</label>
              <textarea 
                value={orderRemarks}
                onChange={(e) => setOrderRemarks(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600" 
                rows="2"
                placeholder="Any special instructions for the supplier..."
              ></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsOrderModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-4 py-2 bg-active-btn text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Creating PO...' : 'Confirm Order'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Products;
