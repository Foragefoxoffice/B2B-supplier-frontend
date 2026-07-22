import React, { useState, useEffect } from 'react';
import {
  CheckCircle, Trash2, Eye,
  Search, Filter, Download, Plus, ChevronLeft, ChevronRight,
  Package, AlertTriangle, Bell, FileText, ArrowUpRight, ArrowDownRight, Image, Building,
  BookAIcon, Calendar, Loader2, X
} from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getProductsApi, createProductApi, updateProductApi, approveProductApi, deleteProductApi, deleteProductImageApi, getSuppliersApi, getCategoriesApi, createOrderApi } from '../commonApi/api';
import Modal from '../components/ui/Modal';
import ProductGallery from './ProductGallery';
import ImageZoomModal from '../components/common/ImageZoomModal';
import { getPaletteSync } from 'colorthief';
import imageCompression from 'browser-image-compression';
import namer from 'color-namer';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import SelectField from '../components/common/SelectField';
import Pagination from '../components/common/Pagination';

const resolveSingleColor = (colorName) => {
  if (!colorName) return '#CBD5E1';
  const color = colorName.toLowerCase().trim();
  if (color.includes('red') || color.includes('crimson') || color.includes('ruby')) return '#EF4444';
  if (color.includes('dark blue') || color.includes('navy')) return '#1E3A8A';
  if (color.includes('blue') || color.includes('royal')) return '#3B82F6';
  if (color.includes('green') || color.includes('emerald') || color.includes('olive')) return '#10B981';
  if (color.includes('yellow') || color.includes('amber')) return '#F59E0B';
  if (color.includes('pink') || color.includes('rose') || color.includes('magenta')) return '#EC4899';
  if (color.includes('purple') || color.includes('violet') || color.includes('lavender') || color.includes('plum')) return '#8B5CF6';
  if (color.includes('orange') || color.includes('coral')) return '#F97316';
  if (color.includes('black') || color.includes('charcoal')) return '#1E293B';
  if (color.includes('white') || color.includes('cream') || color.includes('ivory')) return '#F8FAFC';
  if (color.includes('grey') || color.includes('gray') || color.includes('slate')) return '#64748B';
  if (color.includes('gold') || color.includes('bronze') || color.includes('mustard')) return '#D97706';
  if (color.includes('brown') || color.includes('chocolate') || color.includes('coffee') || color.includes('tan')) return '#78350F';
  if (color.includes('cyan') || color.includes('teal') || color.includes('turquoise')) return '#14B8A6';

  // Hash color name to get a consistent soft color
  let hash = 0;
  for (let i = 0; i < colorName.length; i++) {
    hash = colorName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 65%, 55%)`;
};

const getColorDotStyle = (colorName) => {
  if (!colorName) return { backgroundColor: '#CBD5E1' };

  const parts = colorName.split(/[\+\/]|and/i).map(part => part.trim()).filter(Boolean);

  if (parts.length === 1) {
    return { backgroundColor: resolveSingleColor(parts[0]) };
  } else if (parts.length > 1) {
    const colors = parts.map(resolveSingleColor);
    if (colors.length === 2) {
      return { background: `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)` };
    } else {
      const gradientParts = colors.map((col, idx) => {
        const start = (idx / colors.length) * 100;
        const end = ((idx + 1) / colors.length) * 100;
        return `${col} ${start}%, ${col} ${end}%`;
      });
      return { background: `linear-gradient(135deg, ${gradientParts.join(', ')})` };
    }
  }
  return { backgroundColor: '#CBD5E1' };
};

const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `Age: ${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  return 'Age: Just now';
};

const AdminSupplierProducts = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState(null);
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userSupplierId, setUserSupplierId] = useState(null);

  const [editingProduct, setEditingProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const [viewingProductImagesProduct, setViewingProductImagesProduct] = useState(null);
  const [isViewImagesModalOpen, setIsViewImagesModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);
  const [dynamicGst, setDynamicGst] = useState('');

  // Redesign state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Admin Catalog View State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null); // Product selected for variant detail grid view
  const [variantQuantities, setVariantQuantities] = useState({}); // Stores quantities for each color variant card in detail grid
  const [batchOrderingState, setBatchOrderingState] = useState({ active: false, currentStep: 0, totalSteps: 0 });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    outOfStock: 0,
    lowStock: 0,
    draft: 0,
    trends: null
  });

  // Reset selected category and page when supplier changes
  useEffect(() => {
    setSelectedCategory('');
    setCurrentPage(1);
    setSelectedProductForDetail(null);
    setVariantQuantities({});
  }, [selectedSupplierId]);

  // Get active categories for the selected supplier
  const getSupplierCategories = () => {
    if (userRole === 'SUPPLIER') return categories;
    if (!selectedSupplierId) return categories;

    // Find all category IDs used by products of the selected supplier
    const activeCategoryIds = new Set(
      allProducts
        .filter(p => p.supplier_id === parseInt(selectedSupplierId))
        .map(p => p.category_id)
    );

    return categories.filter(c => activeCategoryIds.has(c.id));
  };

  const getStatusBadgeStyle = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          dot: 'bg-emerald-500',
          label: 'Active'
        };
      case 'PENDING':
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-100',
          dot: 'bg-slate-400',
          label: 'Draft'
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-100',
          dot: 'bg-rose-500',
          label: 'Inactive'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-100',
          dot: 'bg-slate-400',
          label: status || 'Unknown'
        };
    }
  };

  const getStockDetails = (product) => {
    const totalStock = product.images && product.images.length > 0
      ? product.images.reduce((sum, img) => sum + (img.quantity || 0), 0)
      : 0;

    if (totalStock === 0) {
      return {
        count: 0,
        label: 'Out of Stock',
        color: 'text-rose-600 bg-rose-50 border-rose-100'
      };
    } else if (totalStock <= (product.supplier?.low_stock_threshold !== undefined ? product.supplier.low_stock_threshold : 10)) {
      return {
        count: totalStock,
        label: 'Low Stock',
        color: 'text-amber-600 bg-amber-50 border-amber-100'
      };
    } else {
      return {
        count: totalStock,
        label: 'In Stock',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
      };
    }
  };

  const handleViewImagesClick = (product) => {
    setViewingProductImagesProduct(product);
    setSelectedImageIndex(0);
    setDynamicGst(product.gst || '');
    setIsViewImagesModalOpen(true);
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsCompressing(true);
      let files = Array.from(e.target.files);

      const options = {
        maxSizeMB: 0.15, // Stricter limit to ensure it's under 200kb
        maxWidthOrHeight: 1280, // Reduce max resolution
        useWebWorker: true,
        initialQuality: 0.7 // Start at lower quality to guarantee size limit
      };

      try {
        files = await Promise.all(
          files.map(async (file) => {
            if (file.type.startsWith('image/')) {
              try {
                return await imageCompression(file, options);
              } catch (error) {
                console.error('Error compressing image:', error);
                return file;
              }
            }
            return file;
          })
        );
      } catch (error) {
        console.error('Error during image compression:', error);
      } finally {
        setIsCompressing(false);
      }

      const newFilesPromises = files.map(file => {
        return new Promise((resolve) => {
          const previewUrl = URL.createObjectURL(file);
          const img = new window.Image();
          img.src = previewUrl;

          img.onload = () => {
            let colorName = '';
            try {
              const palette = getPaletteSync(img, { colorCount: 10, ignoreWhite: true });
              if (palette && palette.length > 0) {
                let bestColor = palette[0];
                for (let c of palette) {
                  const { r, g, b } = c.rgb();
                  const max = Math.max(r, g, b);
                  const min = Math.min(r, g, b);
                  const saturation = max === 0 ? 0 : (max - min) / max;
                  const brightness = (r + g + b) / (3 * 255);

                  // Prefer colors with some saturation (not grey) and not too dark/bright
                  if (saturation > 0.15 && brightness > 0.15 && brightness < 0.95) {
                    bestColor = c;
                    break;
                  }
                }
                const { r, g, b } = bestColor.rgb();

                const names = namer(`rgb(${r}, ${g}, ${b})`);
                // Use the closest name from the NTC (Name That Color) list which has a huge variety
                colorName = names.ntc[0].name;
              }
            } catch (err) {
              console.error('Error detecting color:', err);
            }

            resolve({
              file,
              previewUrl,
              color: colorName,
              quantity: 0,
              isNew: true
            });
          };

          img.onerror = () => {
            resolve({
              file,
              previewUrl,
              color: '',
              quantity: 0,
              isNew: true
            });
          };
        });
      });

      const newFiles = await Promise.all(newFilesPromises);
      setProductImages(prev => [...prev, ...newFiles.map(f => ({ type: 'new', data: f }))]);
    }
  };

  const handleImageMetaChange = (index, field, value) => {
    setProductImages(prev => prev.map((img, i) => {
      if (i === index) {
        return { ...img, data: { ...img.data, [field]: field === 'quantity' ? parseInt(value) || 0 : value } };
      }
      return img;
    }));
  };

  const handleRemoveImage = (index) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  const makePrimaryImage = (index) => {
    if (index === 0) return;
    setProductImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(index, 1);
      newImages.unshift(movedImage);
      return newImages;
    });
  };

  const formatPrice = (val) => {
    if (val === null || val === undefined) return '';
    let strVal = String(val).replace(/[^0-9.]/g, '');
    if (!strVal) return '';
    const parts = strVal.split('.');
    if (parts[0]) {
      parts[0] = parseInt(parts[0], 10).toLocaleString('en-IN');
    }
    return parts.join('.');
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setProductImages((product.images || []).map(img => ({ type: 'existing', data: img })));
    reset({
      name: product.name,
      product_code: product.product_code || '',
      description: product.description || '',
      price: formatPrice(product.price),
      moq: product.moq || 1,
      unit: product.unit || 'pcs',
      category_id: product.category_id,
      supplier_id: product.supplier_id,
      gst: product.gst || '',
      material: product.material || ''
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const parsedUser = JSON.parse(userString);
      setUserRole(parsedUser.role);
      setUserSupplierId(parsedUser.supplier_id);
    }

    fetchProducts();
    fetchSuppliersAndCategories();

    const handleNotification = (e) => {
      const type = e.detail?.type;
      if (['PRODUCT_UPDATE', 'NEW_PRODUCT'].includes(type)) {
        fetchProducts();
      }
    };
    window.addEventListener('app_notification', handleNotification);
    return () => window.removeEventListener('app_notification', handleNotification);
  }, []);

  useEffect(() => {
    setSelectedProductForDetail(prev => {
      if (!prev) return prev;
      const fresh = allProducts.find(p => p.id === prev.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(prev)) {
        return fresh;
      }
      return prev;
    });
  }, [allProducts]);

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
      const data = await getProductsApi({ limit: 10000 });
      if (data.success) {
        setAllProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allProducts) return;

    // Filter products for stats calculation based on ALL current filters
    const statsProducts = allProducts.filter(product => {
      const matchesSupplier = userRole === 'SUPPLIER' ||
        selectedSupplierId === '' ||
        product.supplier_id === parseInt(selectedSupplierId);

      const matchesSearch = searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.product_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === '' ||
        product.category_id === parseInt(selectedCategory);

      let mappedStatus = '';
      if (product.status === 'APPROVED') mappedStatus = 'ACTIVE';
      else if (product.status === 'PENDING') mappedStatus = 'DRAFT';
      else if (product.status === 'REJECTED') mappedStatus = 'INACTIVE';

      const matchesStatus = selectedStatus === '' || mappedStatus === selectedStatus;

      const totalStock = product.images && product.images.length > 0
        ? product.images.reduce((sum, img) => sum + (img.quantity || 0), 0)
        : 0;

      let stockStatus = '';
      const threshold = product.supplier?.low_stock_threshold !== undefined ? product.supplier.low_stock_threshold : 10;
      if (totalStock === 0) stockStatus = 'OUT_OF_STOCK';
      else if (totalStock <= threshold) stockStatus = 'LOW_STOCK';
      else stockStatus = 'IN_STOCK';

      const matchesStockStatus = selectedStockStatus === '' || stockStatus === selectedStockStatus;

      return matchesSupplier && matchesSearch && matchesCategory && matchesStatus && matchesStockStatus;
    });

    const total = statsProducts.length;
    const active = statsProducts.filter(p => p.status === 'APPROVED').length;
    const draft = statsProducts.filter(p => p.status === 'PENDING').length;

    let outOfStock = 0;
    let lowStock = 0;

    statsProducts.forEach(p => {
      const totalStock = p.images && p.images.length > 0
        ? p.images.reduce((sum, img) => sum + (img.quantity || 0), 0)
        : 0;

      const threshold = p.supplier?.low_stock_threshold !== undefined ? p.supplier.low_stock_threshold : 10;
      if (totalStock === 0) {
        outOfStock++;
      } else if (totalStock <= threshold) {
        lowStock++;
      }
    });

    const calculateTrend = (data, filterFn = () => true) => {
      if (!data || data.length === 0) return { trend: 'up', value: '0%' };

      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);

      const twoMonthsAgo = new Date(oneMonthAgo);
      twoMonthsAgo.setMonth(oneMonthAgo.getMonth() - 1);

      let thisPeriodCount = 0; let lastPeriodCount = 0;
      data.forEach(item => {
        if (!filterFn(item)) return;
        const itemDate = new Date(item.created_at);
        if (isNaN(itemDate.getTime())) return;

        if (itemDate > oneMonthAgo && itemDate <= now) {
          thisPeriodCount++;
        } else if (itemDate > twoMonthsAgo && itemDate <= oneMonthAgo) {
          lastPeriodCount++;
        }
      });

      if (lastPeriodCount === 0) {
        if (thisPeriodCount === 0) return { trend: 'up', value: '0%' };
        return { trend: 'up', value: '100%' };
      }

      const percentageChange = ((thisPeriodCount - lastPeriodCount) / lastPeriodCount) * 100;
      return {
        trend: percentageChange >= 0 ? 'up' : 'down',
        value: `${Math.abs(percentageChange).toFixed(1)}%`
      };
    };

    const trends = {
      total: calculateTrend(statsProducts),
      active: calculateTrend(statsProducts, p => p.status === 'APPROVED'),
      outOfStock: calculateTrend(statsProducts, p => {
        const totalStock = p.images && p.images.length > 0 ? p.images.reduce((sum, img) => sum + (img.quantity || 0), 0) : 0;
        return totalStock === 0;
      }),
      lowStock: calculateTrend(statsProducts, p => {
        const totalStock = p.images && p.images.length > 0 ? p.images.reduce((sum, img) => sum + (img.quantity || 0), 0) : 0;
        const threshold = p.supplier?.low_stock_threshold !== undefined ? p.supplier.low_stock_threshold : 10;
        return totalStock > 0 && totalStock <= threshold;
      }),
      draft: calculateTrend(statsProducts, p => p.status === 'PENDING')
    };

    setStats({ total, active, outOfStock, lowStock, draft, trends });
  }, [allProducts, selectedSupplierId, selectedCategory, searchQuery, selectedStatus, selectedStockStatus, userRole]);

  const filteredProducts = allProducts.filter(product => {
    const matchesSupplier = userRole === 'SUPPLIER' ||
      selectedSupplierId === '' ||
      product.supplier_id === parseInt(selectedSupplierId);

    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === '' ||
      product.category_id === parseInt(selectedCategory);

    let mappedStatus = '';
    if (product.status === 'APPROVED') mappedStatus = 'ACTIVE';
    else if (product.status === 'PENDING') mappedStatus = 'DRAFT';
    else if (product.status === 'REJECTED') mappedStatus = 'INACTIVE';

    const matchesStatus = selectedStatus === '' || mappedStatus === selectedStatus;

    const totalStock = product.images && product.images.length > 0
      ? product.images.reduce((sum, img) => sum + (img.quantity || 0), 0)
      : 0;

    let stockStatus = '';
    const threshold = product.supplier?.low_stock_threshold !== undefined ? product.supplier.low_stock_threshold : 10;
    if (totalStock === 0) stockStatus = 'OUT_OF_STOCK';
    else if (totalStock <= threshold) stockStatus = 'LOW_STOCK';
    else stockStatus = 'IN_STOCK';

    const matchesStockStatus = selectedStockStatus === '' || stockStatus === selectedStockStatus;

    return matchesSupplier && matchesSearch && matchesCategory && matchesStatus && matchesStockStatus;
  });

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus, selectedStockStatus]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = paginatedProducts.map(p => p.id);
      setSelectedProductIds(allIds);
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedProductIds(prev => [...prev, id]);
    } else {
      setSelectedProductIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleDownloadImagesZIP = async () => {
    if (filteredProducts.length === 0) {
      toast.error("No products match the current filters.");
      return;
    }

    setIsDownloadingImages(true);
    const toastId = toast.loading('Generating ZIP with images and prices...');

    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');

      const zip = new JSZip();

      let imageCount = 0;

      for (const product of filteredProducts) {
        if (!product.images || product.images.length === 0) continue;

        for (let i = 0; i < product.images.length; i++) {
          const imgData = product.images[i];
          const imageUrl = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${imgData.url}`;

          try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();

            const img = new window.Image();
            const imgLoadPromise = new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
            });

            img.src = URL.createObjectURL(blob);

            await imgLoadPromise;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            const priceText = `RS.${parseFloat(product.price).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

            const fontSize = Math.max(Math.floor(canvas.width / 12), 24);
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const padding = fontSize * 0.5;
            const textMetrics = ctx.measureText(priceText);
            const textWidth = textMetrics.width;
            const textHeight = fontSize;

            const bgWidth = textWidth + (padding * 2);
            const bgHeight = textHeight + padding;
            const bgX = (canvas.width - bgWidth) / 2;
            const bgY = canvas.height - bgHeight - (padding / 2);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

            ctx.fillStyle = '#3B82F6';
            ctx.fillText(priceText, canvas.width / 2, bgY + (bgHeight / 2) + (fontSize * 0.1));

            const canvasBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));

            const safeName = (product.name || 'product').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `${product.product_code || 'sku'}_${safeName}_${i + 1}.jpg`;
            zip.file(fileName, canvasBlob);
            imageCount++;

          } catch (err) {
            console.error(`Failed to process image ${i + 1} for product ${product.name}`, err);
          }
        }
      }

      if (imageCount === 0) {
        toast.error('No images found for the filtered products.', { id: toastId });
        setIsDownloadingImages(false);
        return;
      }

      toast.loading(`Zipping ${imageCount} images...`, { id: toastId });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `product_images_${Date.now()}.zip`);

      toast.success(`Successfully downloaded ${imageCount} images!`, { id: toastId });
    } catch (error) {
      console.error('Error creating zip:', error);
      toast.error('Failed to download images ZIP.', { id: toastId });
    } finally {
      setIsDownloadingImages(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      toast.error("No products to export.");
      return;
    }

    const headers = ["Product Name", "SKU", "Category", "Price", "Stock", "Status"];
    const rows = filteredProducts.map(p => {
      const totalStock = p.images && p.images.length > 0
        ? p.images.reduce((sum, img) => sum + (img.quantity || 0), 0)
        : 0;
      const statusDetails = getStatusBadgeStyle(p.status);
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        p.product_code,
        `"${p.category?.name?.replace(/"/g, '""') || ''}"`,
        parseFloat(p.price).toFixed(2),
        totalStock,
        statusDetails.label
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('product_code', data.product_code || '');
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('price', String(data.price).replace(/,/g, ''));
      formData.append('moq', data.moq || 1);
      formData.append('unit', data.unit || 'pcs');
      formData.append('gst', data.gst || '');
      formData.append('material', data.material || '');

      // If role is SUPPLIER, the backend will auto-inject the supplier ID, but we can pass it if we have it.
      if (userRole !== 'SUPPLIER') {
        formData.append('supplier_id', data.supplier_id);
      } else {
        formData.append('supplier_id', userSupplierId || '');
      }
      formData.append('category_id', data.category_id);

      const metadata = [];

      let fileIndexCounter = 0;
      productImages.forEach((img) => {
        if (img.type === 'existing') {
          metadata.push({
            id: img.data.id,
            color: img.data.color || '',
            quantity: img.data.quantity || 0,
            isNew: false
          });
        } else {
          formData.append('images', img.data.file, img.data.file.name || `image-${fileIndexCounter}.jpg`);
          metadata.push({
            isNew: true,
            fileIndex: fileIndexCounter++,
            color: img.data.color || '',
            quantity: img.data.quantity || 0
          });
        }
      });

      formData.append('imagesMetadata', JSON.stringify(metadata));

      if (editingProduct) {
        await updateProductApi(editingProduct.id, formData);
        toast.success('Product updated successfully!');
      } else {
        await createProductApi(formData);
        toast.success('Product created successfully!');
      }

      setIsModalOpen(false);
      reset();
      setProductImages([]);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVariantQty = (variantId, delta, maxAvailable = 9999) => {
    setVariantQuantities(prev => {
      const current = prev[variantId] || 0;
      const next = Math.min(maxAvailable, Math.max(0, current + delta));
      return { ...prev, [variantId]: next };
    });
  };

  const handleSetVariantQty = (variantId, value, maxAvailable = 9999) => {
    const val = Math.min(maxAvailable, Math.max(0, parseInt(value) || 0));
    setVariantQuantities(prev => ({ ...prev, [variantId]: val }));
  };

  const handleDelete = (id) => {
    setDeleteProductId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteProductApi(deleteProductId);
      toast.success('Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product.');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteProductId(null);
    }
  };

  const handleDeleteImage = (imageId) => {
    setDeleteImageId(imageId);
    setShowDeleteImageConfirm(true);
  };

  const confirmDeleteImage = async () => {
    if (!deleteImageId) return;
    try {
      await deleteProductImageApi(deleteImageId);
      toast.success('Color variant deleted successfully!');
      fetchProducts();
      if (viewingProductImagesProduct) {
        setIsViewImagesModalOpen(false);
        setViewingProductImagesProduct(null);
      }
    } catch (error) {
      console.error('Error deleting color variant:', error);
      toast.error('Failed to delete color variant.');
    } finally {
      setShowDeleteImageConfirm(false);
      setDeleteImageId(null);
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await approveProductApi(id, status);
      toast.success(`Product ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully!`);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status.');
    }
  };

  return (
    <div className="space-y-6">
      {true ? (
        <>
          {/* Header section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl flex items-center gap-2 font-semibold text-slate-800">
                <BookAIcon className="text-[#2563EB]" /> Supplier Products
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Manage your product catalog and inventory
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadImagesZIP}
                disabled={isDownloadingImages}
                className="flex items-center px-4 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors font-medium shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDownloadingImages ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Image className="h-4 w-4 mr-2 text-blue-500" />}
                Download Images
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center px-4 py-1.5 border border-slate-200 text-slate-700 bg-white rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2 text-slate-500" />
                Export
              </button>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* Total Products Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
                  <Package className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="text-sm mb-2 font-semibold text-slate-500 block">Total Products</span>
                  <span className="text-2xl font-semibold text-slate-800">{stats.total}</span>
                </div>
              </div>
              <div className={`mt-4 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-xs ${stats.trends?.total?.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'} font-semibold`}>
                {stats.trends?.total?.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{stats.trends?.total?.trend === 'up' ? '+' : '-'}{stats.trends?.total?.value}</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>

            {/* Active Products Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
                  <CheckCircle className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="text-sm mb-2 font-semibold text-slate-500 block">Active Products</span>
                  <span className="text-2xl font-semibold text-slate-800">{stats.active}</span>
                </div>
              </div>
              <div className={`mt-4 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-xs ${stats.trends?.active?.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'} font-semibold`}>
                {stats.trends?.active?.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{stats.trends?.active?.trend === 'up' ? '+' : '-'}{stats.trends?.active?.value}</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>

            {/* Out of Stock Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600 shrink-0">
                  <AlertTriangle className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="text-sm mb-2 font-semibold text-slate-500 block">Out of Stock</span>
                  <span className="text-2xl font-semibold text-slate-800">{stats.outOfStock}</span>
                </div>
              </div>
              <div className={`mt-4 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-xs ${stats.trends?.outOfStock?.trend === 'up' ? 'text-rose-600' : 'text-emerald-600'} font-semibold`}>
                {stats.trends?.outOfStock?.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{stats.trends?.outOfStock?.trend === 'up' ? '+' : '-'}{stats.trends?.outOfStock?.value}</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>

            {/* Low Stock Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 shrink-0">
                  <Bell className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="text-sm mb-2 font-semibold text-slate-500 block">Low Stock</span>
                  <span className="text-2xl font-semibold text-slate-800">{stats.lowStock}</span>
                </div>
              </div>
              <div className={`mt-4 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-xs ${stats.trends?.lowStock?.trend === 'up' ? 'text-rose-600' : 'text-emerald-600'} font-semibold`}>
                {stats.trends?.lowStock?.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{stats.trends?.lowStock?.trend === 'up' ? '+' : '-'}{stats.trends?.lowStock?.value}</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>

            {/* Draft Products Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-slate-50 text-slate-600 shrink-0">
                  <FileText className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="text-sm mb-2 font-semibold text-slate-500 block">Draft Products</span>
                  <span className="text-2xl font-semibold text-slate-800">{stats.draft}</span>
                </div>
              </div>
              {stats.trends?.draft?.value === '0%' ? (
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <span>—</span>
                  <span className="text-slate-400 font-normal ml-1">No change</span>
                </div>
              ) : (
                <div className={`mt-4 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-xs ${stats.trends?.draft?.trend === 'up' ? 'text-amber-500' : 'text-emerald-600'} font-semibold`}>
                  {stats.trends?.draft?.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{stats.trends?.draft?.trend === 'up' ? '+' : '-'}{stats.trends?.draft?.value}</span>
                  <span className="text-slate-400 font-normal">vs last month</span>
                </div>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 flex-1">
              <div className="flex flex-col gap-1.5 lg:col-span-1">
                <span className="text-sm font-semibold text-slate-600">Search</span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all text-sm bg-white"
                  />
                </div>
              </div>


              <SelectField
                label="Supplier"
                labelClassName="font-semibold text-slate-600"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="rounded-xl px-3 py-2 text-sm cursor-pointer font-medium text-slate-700"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name?.toUpperCase()}</option>
                ))}
              </SelectField>

              {/* Category Dropdown */}
              <SelectField
                label="Category"
                labelClassName="font-semibold text-slate-600"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl px-3 py-2 text-sm cursor-pointer font-medium text-slate-700"
              >
                <option value="">All Categories</option>
                {getSupplierCategories().map(c => (
                  <option key={c.id} value={c.id}>{c.name?.toUpperCase()}</option>
                ))}
              </SelectField>

              {/* Status Dropdown */}
              <SelectField
                label="Status"
                labelClassName="font-semibold text-slate-600"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl px-3 py-2 text-sm cursor-pointer font-medium text-slate-700"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="INACTIVE">Inactive</option>
              </SelectField>

              {/* Stock Status Dropdown */}
              <SelectField
                label="Stock Status"
                labelClassName="font-semibold text-slate-600"
                value={selectedStockStatus}
                onChange={(e) => setSelectedStockStatus(e.target.value)}
                className="rounded-xl px-3 py-2 text-sm cursor-pointer font-medium text-slate-700"
              >
                <option value="">All Stock Status</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </SelectField>
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSelectedStatus('');
                setSelectedStockStatus('');
              }}
              className="flex items-center justify-center px-4 py-2 border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-sm font-semibold h-[38px] xl:self-end cursor-pointer gap-1.5 shadow-xs"
            >
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Clear Filters</span>
            </button>
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <TableSkeleton columns={8} rows={10} />
              ) : paginatedProducts.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-medium">No products match your search or filter options.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-[14px] font-semibold">
                      <th className="py-4 px-5 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={paginatedProducts.length > 0 && selectedProductIds.length === paginatedProducts.length}
                          onChange={handleSelectAll}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-4 px-4 font-semibold text-slate-500">Product</th>
                      <th className="py-4 px-4 font-semibold text-slate-500">SKU</th>
                      <th className="py-4 px-4 font-semibold text-slate-500">Category</th>
                      <th className="py-4 px-4 font-semibold text-slate-500">Price</th>
                      <th className="py-4 px-4 font-semibold text-slate-500">Stock</th>
                      <th className="py-4 px-4 font-semibold text-slate-500">Status</th>
                      <th className="py-4 px-5 text-right font-semibold text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedProducts.map((product) => {
                      const isChecked = selectedProductIds.includes(product.id);
                      const stockDetails = getStockDetails(product);
                      const statusDetails = getStatusBadgeStyle(product.status);

                      return (
                        <tr key={product.id} className={`hover:bg-slate-50/40 transition-colors ${isChecked ? 'bg-blue-50/10' : ''}`}>
                          <td className="py-4 px-5 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleSelectRow(product.id, e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                {product.images && product.images.length > 0 ? (
                                  <ImageZoomModal src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${product.images[0].url}`} alt={product.name?.toUpperCase()} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">No image</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800 text-md block truncate max-w-[200px]" title={product.name?.toUpperCase()}>
                                  {product.name?.toUpperCase()}
                                </span>
                                <span className="text-xs text-slate-400 block truncate max-w-[200px]" title={product.description || 'Premium Quality'}>
                                  {product.description || 'Premium Quality'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm font-semibold text-slate-500">{product.product_code?.toUpperCase()}</td>
                          <td className="py-4 px-4 text-sm text-slate-600 font-medium">{product.category?.name}</td>
                          <td className="py-4 px-4 text-sm font-semibold text-slate-800">
                            ₹{parseFloat(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-800">{stockDetails.count}</span>
                              <span className={`text-[11px] font-bold ${stockDetails.label === 'In Stock' ? 'text-emerald-500' : stockDetails.label === 'Low Stock' ? 'text-amber-500' : 'text-rose-500'}`}>
                                {stockDetails.label}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${statusDetails.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDetails.dot}`}></span>
                              {statusDetails.label}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <button
                                onClick={() => handleViewImagesClick(product)}
                                className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="View Variant Images"
                              >
                                <Eye className="h-4.5 w-4.5" />
                              </button>

                              <button
                                onClick={() => handleDelete(product.id)}
                                className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table Pagination Footer */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
              totalItems={totalItems}
            />
          </div>
        </>
      ) : (
        /* Render Premium Admin Catalog View */
        <div className="space-y-6 animate-fade-in">
          {/* Admin Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-navy-dark flex items-center gap-2.5">
                <Building className="h-6.5 w-6.5 text-secondary" />
                Supplier Catalogs
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Browse designs and order products from verified B2B suppliers.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadImagesZIP}
                disabled={isDownloadingImages}
                className="flex items-center px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors font-semibold shadow-xs cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {isDownloadingImages ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Image className="h-4 w-4 mr-2 text-blue-500" />}
                Download Images
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-xl hover:bg-slate-50 transition-colors font-semibold shadow-xs cursor-pointer text-xs uppercase tracking-wider"
              >
                <Download className="h-4 w-4 mr-2 text-slate-500" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Split Catalog View */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Sidebar: Suppliers List */}
            {!selectedProductForDetail && (
              <div className="w-full lg:w-72 xl:w-80 shrink-0 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-4 lg:sticky lg:top-[-20px]">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[16px] font-medium text-slate-400 block mb-2 px-0.5">Suppliers</span>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      placeholder="Search supplier..."
                      value={supplierSearchQuery}
                      onChange={(e) => setSupplierSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/25 transition-all text-sm bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1 sidebar-scroll">
                  {suppliers.filter(s =>
                    s.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
                    s.supplier_code.toLowerCase().includes(supplierSearchQuery.toLowerCase())
                  ).map(s => {
                    const isSelected = s.id.toString() === selectedSupplierId;
                    const supplierProdCount = allProducts.filter(p => p.supplier_id === s.id).length;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSupplierId(s.id.toString())}
                        className={`flex items-center text-left gap-3 p-3 rounded-xl transition-all cursor-pointer border ${isSelected
                          ? 'bg-blue-50/30 border-secondary/40 shadow-xs ring-1 ring-secondary/20'
                          : 'border-transparent hover:bg-slate-50'
                          }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs uppercase transition-all duration-300 ${isSelected
                          ? 'bg-gradient-to-r from-secondary to-primary text-white shadow-xs shadow-secondary/20'
                          : 'bg-slate-100 text-slate-600'
                          }`}>
                          {s.name.substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm block truncate ${isSelected ? 'font-bold text-blue-900' : 'font-semibold text-slate-800'}`}>
                            {s.name?.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 block tracking-wider font-medium uppercase">{s.supplier_code}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isSelected ? 'bg-secondary/15 text-blue-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                          {supplierProdCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Right Pane: Catalog and Products Grid */}
            <div className="flex-1 w-full space-y-6">
              {(() => {
                const selectedSupplier = suppliers.find(s => s.id === parseInt(selectedSupplierId));
                if (!selectedSupplier) {
                  return (
                    <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm text-slate-450 font-medium">
                      Select a supplier from the left sidebar to view their design catalog.
                    </div>
                  );
                }

                const activeCats = getSupplierCategories();

                return (
                  <>
                    {/* Selected Supplier Banner */}
                    <div className="bg-gradient-to-br from-navy-dark via-[#081635] to-[#122856] text-white rounded-2xl p-6 shadow-md border-l-[4px] border-secondary flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden animate-fade-in">
                      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

                      <div className="relative z-10 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5 mb-2">
                          <span className="text-[10px] font-semibold tracking-widest bg-secondary text-white px-2.5 py-0.75 rounded-md uppercase font-sans shadow-xs">
                            {selectedSupplier.supplier_code}
                          </span>
                          <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active Supplier Partner
                          </span>
                        </div>
                        <h3 className="text-2xl font-semibold text-white">{selectedSupplier.name}</h3>
                        <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
                          {selectedSupplier.address}, {selectedSupplier.city}, {selectedSupplier.state} - {selectedSupplier.pincode}
                        </p>
                      </div>

                      <div className="relative flex flex-col text-xs text-slate-200 gap-2 shrink-0 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-xs min-w-[300px] shadow-inner">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400 font-medium">Email:</span>
                          <span className="font-medium text-white" title={selectedSupplier.email}>{selectedSupplier.email}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400 font-medium">Phone:</span>
                          <span className="font-medium text-white">{selectedSupplier.phone}</span>
                        </div>
                        {selectedSupplier.gst && (
                          <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-1.5 mt-0.5">
                            <span className="text-orange-500 font-semibold">GSTIN:</span>
                            <span className="font-semibold text-orange-500 tracking-wide">{selectedSupplier.gst}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedProductForDetail ? (
                      <ProductGallery
                        product={selectedProductForDetail}
                        onBack={() => setSelectedProductForDetail(null)}
                        variantQuantities={variantQuantities}
                        onUpdateVariantQty={handleUpdateVariantQty}
                        onSetVariantQty={handleSetVariantQty}
                      />
                    ) : (
                      /* RENDER STANDARD CATALOG GRID VIEW */
                      <>
                        {/* Unified Search & Category Filters Panel */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-5 animate-fade-in text-left">
                          {/* Categories Row */}
                          <div>
                            <span className="text-[15px] font-semibold text-slate-450 block mb-3 px-0.5">Categories</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setSelectedCategory('')}
                                className={`px-4 py-2 text-md font-medium rounded-xl transition-all duration-200 cursor-pointer select-none border ${selectedCategory === ''
                                  ? 'bg-gradient-to-r from-secondary to-primary border-secondary text-white shadow-xs shadow-secondary/20'
                                  : 'bg-slate-50 border-slate-200/60 text-slate-650 hover:bg-slate-100 hover:text-slate-800'
                                  }`}
                              >
                                All Categories
                              </button>
                              {activeCats.map(cat => (
                                <button
                                  key={cat.id}
                                  onClick={() => setSelectedCategory(cat.id.toString())}
                                  className={`px-4 py-2 text-md font-medium rounded-xl transition-all duration-200 cursor-pointer select-none border ${selectedCategory === cat.id.toString()
                                    ? 'bg-gradient-to-r from-secondary to-primary border-secondary text-white shadow-xs shadow-secondary/20'
                                    : 'bg-slate-50 border-slate-200/60 text-slate-650 hover:bg-slate-100 hover:text-slate-800'
                                    }`}
                                >
                                  {cat.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Inputs Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100/70 items-end">
                            <div className="flex flex-col gap-2">
                              <span className="text-[13px] font-semibold text-slate-500 px-0.5">Search Designs</span>
                              <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Search name or code..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/25 transition-all text-sm bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white text-slate-800 font-medium"
                                />
                              </div>
                            </div>

                            <SelectField
                              label="Design Status"
                              labelClassName="font-semibold text-slate-500 px-0.5"
                              value={selectedStatus}
                              onChange={(e) => setSelectedStatus(e.target.value)}
                              className="rounded-xl px-3.5 py-3 text-sm bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white cursor-pointer font-semibold text-slate-700"
                            >
                              <option value="">All Statuses</option>
                              <option value="ACTIVE">Approved / Active</option>
                              <option value="DRAFT">Pending Approval</option>
                              <option value="INACTIVE">Rejected</option>
                            </SelectField>

                            <SelectField
                              label="Stock Status"
                              labelClassName="font-semibold text-slate-500 px-0.5"
                              value={selectedStockStatus}
                              onChange={(e) => setSelectedStockStatus(e.target.value)}
                              className="rounded-xl px-3.5 py-3 text-sm bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white cursor-pointer font-semibold text-slate-700"
                            >
                              <option value="">All Stocks</option>
                              <option value="IN_STOCK">In Stock</option>
                              <option value="LOW_STOCK">Low Stock</option>
                              <option value="OUT_OF_STOCK">Out of Stock</option>
                            </SelectField>
                          </div>
                        </div>

                        {/* Products Catalog Cards Grid */}
                        {loading ? (
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center text-slate-500 font-medium">
                            Loading products catalog...
                          </div>
                        ) : paginatedProducts.length === 0 ? (
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center text-slate-400 font-semibold flex flex-col items-center justify-center gap-3">
                            <Package className="h-10 w-10 text-slate-300" />
                            <span className='font-medium'>No designs found matching the selected category or filters.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {paginatedProducts.map(product => {
                              const stockDetails = getStockDetails(product);
                              const statusDetails = getStatusBadgeStyle(product.status);
                              const coverImage = product.images && product.images.length > 0 ? product.images[0].url : null;

                              return (
                                <div key={product.id} className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-lg hover:border-slate-250 transition-all duration-300 flex flex-col justify-between overflow-hidden animate-fade-in group">
                                  {/* Saree Cover Image Section */}
                                  <div className="aspect-[8/7] bg-slate-50 relative overflow-hidden shrink-0 border-b border-slate-100/50">
                                    {coverImage ? (
                                      <img
                                        src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${coverImage}`}
                                        alt={product.name?.toUpperCase()}
                                        className="h-full w-full object-cover group-hover:scale-104 transition-transform duration-500 ease-in-out"
                                      />
                                    ) : (
                                      <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50">
                                        <Image className="h-8 w-8 text-slate-350" />
                                        <span className="text-[9px] font-bold uppercase tracking-wider">No Image</span>
                                      </div>
                                    )}

                                    {/* Status Badge overlay (always visible) */}
                                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-5">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold border uppercase tracking-wider shadow-sm bg-white/95 backdrop-blur-xs ${statusDetails.bg}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusDetails.dot}`}></span>
                                        {statusDetails.label}
                                      </span>
                                    </div>

                                    {/* Stock Badge overlay (always visible) */}
                                    <div className="absolute top-3 right-3 z-5">
                                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-semibold shadow-sm tracking-wider uppercase bg-navy-dark text-white/90 border border-white/10 ${stockDetails.label === 'In Stock'
                                        ? 'bg-emerald-600'
                                        : stockDetails.label === 'Low Stock'
                                          ? 'bg-amber-500'
                                          : 'bg-rose-600'
                                        }`}>
                                        {stockDetails.count} {product.unit || 'pcs'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Product Details Section */}
                                  <div className="p-4.5 flex-1 flex flex-col justify-between text-left">
                                    <div>
                                      {/* Category */}
                                      <span className="text-[9.5px] font-semibold text-secondary tracking-widest uppercase block mb-1">
                                        {product.category?.name || 'DESIGN'}
                                      </span>

                                      {/* Product Name */}
                                      <h4 className="font-bold text-navy-dark text-sm leading-snug uppercase tracking-wide truncate mb-2" title={product.name?.toUpperCase()}>
                                        {product.name?.toUpperCase()}
                                      </h4>

                                      {/* Badges Row */}
                                      <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
                                        <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider">
                                          Code: {product.product_code?.toUpperCase()}
                                        </span>
                                        {product.material && (
                                          <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider">
                                            {product.material}
                                          </span>
                                        )}
                                        {product.created_at && (
                                          <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {getTimeAgo(product.created_at)}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Price & MOQ Row */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                                      <div>
                                        <span className="text-emerald-600 text-[12px] font-medium block">Rate</span>
                                        <div className="flex items-baseline gap-1">
                                          <span className="text-sm font-semibold text-navy-dark">
                                            ₹{parseFloat(product.price).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                          </span>
                                          {product.gst && (
                                            <span className="text-[9.5px] text-secondary font-bold">({product.gst} GST)</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        <span className="text-emerald-600 text-[11px] font-semibold block">Min Order</span>
                                        <span className="text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                                          {product.moq || 1} {product.unit || 'pcs'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Footer Action Buttons Section */}
                                  <div className="grid grid-cols-2 gap-2 p-4 pt-0 border-t border-slate-50 mt-1 shrink-0">
                                    <button
                                      onClick={() => handleViewImagesClick(product)}
                                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-md font-medium rounded-xl border border-slate-200 text-center transition-all cursor-pointer select-none hover:text-navy-dark"
                                    >
                                      Quick View
                                    </button>
                                    <button
                                      onClick={() => setSelectedProductForDetail(product)}
                                      className="w-full py-2 bg-gradient-to-r from-secondary to-primary hover:from-blue-500 hover:to-blue-700 text-white text-md font-medium rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer border-0 select-none shadow-xs shadow-secondary/25"
                                    >
                                      <span>Buy Now</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Pagination Footer */}
                        <div className="mt-4 animate-fade-in">
                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={(val) => {
                              setItemsPerPage(val);
                              setCurrentPage(1);
                            }}
                            totalItems={totalItems}
                          />
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Edit Design' : 'Add Design'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Hidden inputs for database schema requirements */}
          <input type="hidden" {...register('moq')} />
          <input type="hidden" {...register('unit')} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Design Code * */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Design Code <span className="text-red-500">*</span></label>
              <input
                {...register('product_code', { required: true })}
                onInput={(e) => e.target.value = e.target.value.toUpperCase()}
                className="w-full border border-slate-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 hover:bg-slate-100/20 transition-all uppercase"
                placeholder="e.g. AGS700"
              />
              {errors.product_code && <span className="text-red-500 text-xs">Design Code is required</span>}
            </div>

            {/* Design Name * */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Design Name
                <span className="text-red-500">*</span></label>
              <input
                {...register('name', { required: true })}
                onInput={(e) => e.target.value = e.target.value.toUpperCase()}
                className="w-full border border-slate-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 hover:bg-slate-100/20 transition-all uppercase"
                placeholder="e.g. PARKAVI"
              />
              {errors.name && <span className="text-red-500 text-xs">Design Name is required</span>}
            </div>

            {/* Category * */}
            <SelectField
              label={<>Category <span className="text-red-500">*</span></>}
              {...register('category_id', { required: true })}
              className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 cursor-pointer"
              error={errors.category_id && "Category is required"}
            >
              <option value="">-- Select Category --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name?.toUpperCase()}</option>
              ))}
            </SelectField>

            {/* Rate (₹) * */}
            <div>
              <label className="block text-sm flex items-center font-semibold text-slate-700 mb-1">Rate (₹)  <span className="text-red-500 ml-2">*Exclusive GST Rate</span></label>
              <input
                type="number"
                step="0.01"
                {...register('price', { required: true })}
                className="w-full border border-slate-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 hover:bg-slate-100/20 transition-all"
                placeholder="e.g. 7000"
              />
              {errors.price && <span className="text-red-500 text-xs">Rate is required</span>}
            </div>

            {/* GST % */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">GST %</label>
              <input
                type="text"
                {...register('gst')}
                className="w-full border border-slate-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 hover:bg-slate-100/20 transition-all"
                placeholder="e.g. 5%"
              />
            </div>

            {/* Material */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Material</label>
              <input
                type="text"
                {...register('material')}
                className="w-full border border-slate-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-slate-50/50 hover:bg-slate-100/20 transition-all"
                placeholder="e.g. Silk"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              {...register('description')}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 h-20 resize-none text-sm bg-slate-50/50 hover:bg-slate-100/20 transition-all"
              placeholder="Design details and specification..."
            ></textarea>
          </div>

          {userRole !== 'SUPPLIER' && (
            <SelectField
              label="Supplier"
              {...register('supplier_id', { required: userRole !== 'SUPPLIER' })}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 cursor-pointer"
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name?.toUpperCase()}</option>
              ))}
            </SelectField>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Design Images</label>
            <p className="text-xs text-orange-400 mb-3 font-medium">
              * Note: The first image in this list will be used as the main cover/front image for the design in catalogs.
            </p>
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={isCompressing}
                className="w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isCompressing && (
                <div className="absolute inset-y-0 right-4 flex items-center justify-center top-0 bottom-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-xs text-blue-600 ml-2 font-medium">Compressing...</span>
                </div>
              )}
            </div>

            {productImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-1">
                {productImages.map((img, idx) => (
                  <div key={img.type === 'existing' ? `existing-${img.data.id}` : `new-${idx}`} className="flex flex-col gap-2">
                    <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50 group shadow-sm hover:shadow-md transition-shadow">
                      <img
                        src={img.type === 'existing' ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${img.data.url}` : img.data.previewUrl}
                        alt={`Image ${idx}`}
                        className="w-full aspect-[3/4] object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 text-red-500 shadow-sm border border-slate-100 z-10 hover:bg-red-50 cursor-pointer"
                        title="Remove Image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      {idx !== 0 && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => makePrimaryImage(idx)}
                            className="text-xs bg-white text-slate-700 hover:text-blue-600 font-bold px-3 py-1.5 rounded-full shadow-sm cursor-pointer transition-colors"
                          >
                            Set as Front
                          </button>
                        </div>
                      )}

                      {idx === 0 && (
                        <div className="absolute bottom-0 inset-x-0 bg-slate-600 text-white text-[11px] font-extrabold text-center py-1.5 uppercase tracking-wider border-t border-slate-500">
                          FRONT
                        </div>
                      )}
                    </div>

                    <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      <input
                        type="number"
                        placeholder="Qty"
                        min="0"
                        value={img.data.quantity === 0 ? '' : img.data.quantity}
                        onChange={(e) => handleImageMetaChange(idx, 'quantity', e.target.value)}
                        className="w-14 text-center text-sm p-2 outline-none border-r border-slate-200 text-slate-700 focus:bg-slate-50"
                      />
                      <input
                        type="text"
                        placeholder="Color"
                        value={img.data.color || ''}
                        onChange={(e) => handleImageMetaChange(idx, 'color', e.target.value)}
                        disabled
                        className="flex-1 text-sm p-2 pl-3 outline-none text-slate-500 bg-slate-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
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
              className="px-4 py-2 bg-active-btn text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Saving...' : (editingProduct ? 'Save Changes' : 'Upload Product')}
            </button>
          </div>
        </form>
      </Modal>

      {/* View All Product Images Modal */}
      <Modal
        isOpen={isViewImagesModalOpen}
        onClose={() => { setIsViewImagesModalOpen(false); setViewingProductImagesProduct(null); }}
        title="Design Details"
        maxWidth="max-w-4xl"
      >
        {viewingProductImagesProduct && (() => {
          const product = viewingProductImagesProduct;
          const images = product.images || [];
          const uniqueColors = images
            ? Array.from(new Set(images.map(img => img.color).filter(Boolean)))
            : [];
          const totalStock = images
            ? images.reduce((sum, img) => sum + (img.quantity || 0), 0)
            : 0;

          // Safe access to the active image
          const activeImage = images[selectedImageIndex] || images[0] || null;

          // Helper to trigger switching image by clicking color tag
          const handleColorTagClick = (colorName) => {
            const idx = images.findIndex(img => img.color === colorName);
            if (idx !== -1) {
              setSelectedImageIndex(idx);
            }
          };

          return (
            <div className="animate-fade-in text-left space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Product Gallery */}
                <div className="lg:col-span-5 space-y-4">
                  {activeImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 aspect-[3/4] group shadow-inner">
                      <ImageZoomModal
                        src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${activeImage.url}`}
                        alt={`${product.name?.toUpperCase()} - ${activeImage.color || 'Variant'}`}
                        className="h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.02]"
                      />

                      {/* Product Age/Upload Date Overlay */}
                      {activeImage?.created_at && (
                        <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-slate-700 text-[11px] font-bold py-1.5 px-3 rounded-full inline-flex items-center gap-1.5 border border-slate-200/50 shadow-lg z-10">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {getTimeAgo(activeImage.created_at)}
                        </span>
                      )}

                      {/* Delete Action Overlay */}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(activeImage.id)}
                        className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-red-500 p-2 rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors z-10"
                        title="Delete this variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Active variant tag overlay */}
                      <span className="absolute bottom-4 left-4 right-4 bg-navy-dark/95 backdrop-blur-xs text-white text-[13px] font-semibold py-2.5 px-3 rounded-xl inline-flex items-center justify-between border border-white/10 shadow-lg">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={getColorDotStyle(activeImage.color)}></span>
                          {activeImage.color || 'Not Specified'}
                        </span>
                        {activeImage.quantity !== undefined && (
                          <span className="text-secondary font-semibold bg-white px-2 py-0.5 rounded text-[9px]">
                            Qty: {activeImage.quantity} {product.unit || 'pcs'}
                          </span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-350 bg-slate-50 flex flex-col items-center justify-center aspect-[3/4] p-6 text-slate-400">
                      <Image className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
                      <span className="text-xs font-semibold">No images available</span>
                    </div>
                  )}

                  {/* Variants Thumbnail Grid */}
                  {images.length > 1 && (
                    <div>
                      <span className="text-[13px] font-semibold text-slate-450 block mb-2 px-0.5">
                        Color Variants ({images.length})
                      </span>
                      <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
                        {images.map((img, idx) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`relative flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImageIndex === idx
                              ? 'border-primary ring-2 ring-primary/20 scale-[0.98]'
                              : 'border-slate-200 hover:border-slate-350 hover:scale-[0.98]'
                              }`}
                          >
                            <img
                              src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${img.url}`}
                              alt={img.color || 'variant'}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Product Details & Specs */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                  <div className="space-y-5">
                    {/* Brand/Code & Title */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[9px] bg-secondary/10 text-secondary border border-secondary/20 px-2.5 py-0.5 rounded font-semibold tracking-widest uppercase">
                          {product.product_code?.toUpperCase()}
                        </span>
                        {product.supplier?.name && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            {product.supplier.name}
                          </span>
                        )}
                      </div>
                      <h3 className="text-3xl font-semibold text-navy-dark">
                        {product.name?.toUpperCase()}
                      </h3>
                    </div>

                    {/* Price and GST Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-450 block mb-0.5">Wholesale Rate</span>
                        <span className="text-2xl font-semibold text-secondary tracking-tight">
                          ₹{parseFloat(product.price).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {product.gst && (
                        <div className="text-right border-l border-slate-200 pl-6">
                          <span className="text-[11px] font-semibold text-slate-450 block mb-0.5">GST Rate</span>
                          <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white text-green-600 border border-slate-200">
                            {product.gst}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 px-4 shadow-3xs">
                        <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Category</span>
                        <span className="text-md font-semibold text-navy-dark mt-0.5 block truncate">
                          {product.category?.name || 'N/A'}
                        </span>
                      </div>
                      {product.material && (
                        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 px-4 shadow-3xs">
                          <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Material</span>
                          <span className="text-md font-semibold text-navy-dark mt-0.5 block truncate">
                            {product.material}
                          </span>
                        </div>
                      )}
                      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 px-4 shadow-3xs col-span-2 sm:col-span-1">
                        <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Total Available Stock</span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase mt-1 ${totalStock === 0
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                          }`}>
                          <span className={`w-2 h-2 rounded-full ${totalStock === 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                          {totalStock} {product.unit || 'pcs'}
                        </span>
                      </div>
                      {product.unit && (
                        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 px-4 shadow-3xs col-span-2 sm:col-span-1">
                          <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Unit Measure</span>
                          <span className="text-md font-semibold text-navy-dark mt-0.5 block truncate">
                            {product.unit}
                          </span>
                        </div>
                      )}
                      
                      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 px-4 shadow-3xs col-span-2 sm:col-span-1 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Est. Sale Value (incl. GST)</span>
                          <span className="text-md font-semibold text-emerald-600 mt-0.5 block truncate">
                            ₹{(parseFloat(product.price || 0) * (1 + parseFloat(dynamicGst || 0) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex flex-col items-end ml-2">
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={dynamicGst}
                              onChange={(e) => setDynamicGst(e.target.value)}
                              className="w-14 py-0.5 pl-2 pr-3.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 rounded-md focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-right shadow-3xs"
                              placeholder="0"
                              style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                              title="Custom GST %"
                            />
                            <span className="absolute right-1.5 text-[10px] font-bold text-emerald-700">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Colors Available */}
                    <div>
                      <span className="text-[13px] font-semibold text-slate-450 block mb-2 px-0.5">Colors Available</span>
                      <div className="flex flex-wrap gap-2">
                        {uniqueColors.length > 0 ? (
                          uniqueColors.map(color => {
                            const isActiveColor = activeImage && activeImage.color === color;
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => handleColorTagClick(color)}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border shadow-3xs ${isActiveColor
                                  ? 'bg-primary text-white border-primary shadow-sm scale-[0.98]'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                                  }`}
                              >
                                <span className={`w-2.5 h-2.5 rounded-full border ${isActiveColor ? 'border-white/30' : 'border-slate-200'}`} style={getColorDotStyle(color)}></span>
                                {color}
                              </button>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold italic">No colors specified</span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <div className="space-y-1.5">
                        <span className="text-[13px] font-semibold text-slate-450 block mb-2 px-0.5">Design Description</span>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/40 border border-slate-200 p-4 rounded-xl shadow-3xs">
                          {product.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        confirmVariant="danger"
      />
      <ConfirmModal
        isOpen={showDeleteImageConfirm}
        title="Delete Color Variant"
        message="Are you sure you want to delete this color variant? This action cannot be undone."
        onConfirm={confirmDeleteImage}
        onCancel={() => { setShowDeleteImageConfirm(false); setDeleteImageId(null); }}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default AdminSupplierProducts;


