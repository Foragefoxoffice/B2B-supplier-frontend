import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrdersApi, getProductsApi, getTransportersApi } from '../commonApi/api';
import { showAnimatedToast } from '../hooks/useNotifications';
import { FullDashboardSkeleton } from '../components/common/SkeletonLoader';
import {
  Calendar, ChevronDown, Package, Box, ClipboardList, Truck, Receipt, ChevronRight,
  Headphones, BarChart3, TrendingUp, Filter, X, Layers, Users
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass, trend, trendValue, sparklinePath, onClick, isActive }) => {
  const isPositive = trend === 'up';
  return (
    <div
      className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer transform hover:-translate-y-1 hover:shadow-sm
       border-slate-100 hover:border-slate-100`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${isActive ? colorClass.replace('text-', 'bg-').replace('500', '100').replace('600', '100') : bgColorClass} ${colorClass}`}>
            <Icon className="h-[22px] w-[22px]" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-500">{title}</p>
            <h3 className="text-2xl font-semibold text-slate-800 leading-none mt-1.5">{value}</h3>
          </div>
        </div>
        {/* Sparkline SVG */}
        <div className="w-16 h-8 shrink-0">
          <svg className={`w-full h-full ${colorClass}`} style={{ overflow: 'visible' }} viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <style>{`
              @keyframes draw-sparkline-svg {
                from { stroke-dashoffset: 150; }
                to { stroke-dashoffset: 0; }
              }
              .sparkline-animated {
                stroke-dasharray: 150;
                stroke-dashoffset: 150;
                animation: draw-sparkline-svg 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
              }
            `}</style>
            <path className="sparkline-animated" d={sparklinePath} />
          </svg>
        </div>
      </div>

      <div className="flex items-center mt-5 text-[13px]">
        <span className={`flex items-center font-bold mr-1.5 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? '↑' : '↓'} {trendValue}
        </span>
        <span className="text-slate-400 font-medium">vs last month</span>
      </div>
    </div>
  );
};

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartView, setChartView] = useState('orders'); // 'orders' or 'revenue'
  const [statusFilter, setStatusFilter] = useState(null);

  // Chart States
  const [lineChartData, setLineChartData] = useState({
    labels: Array(20).fill(''),
    datasets: []
  });

  const [barChartData, setBarChartData] = useState({
    labels: Array(20).fill(''),
    datasets: []
  });

  const [doughnutData, setDoughnutData] = useState({
    labels: ['Confirmed', 'Pending', 'In Production', 'Shipped'],
    datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'], borderWidth: 0 }]
  });

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { first_name: 'Ramesh', last_name: 'Kumar', role: 'SUPPLIER', company_name: 'Supplier Co.' };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, productsRes, transportersRes] = await Promise.all([
        getOrdersApi(),
        getProductsApi(),
        getTransportersApi()
      ]);

      if (ordersRes.success) setOrders(ordersRes.data);
      if (productsRes.success) {
        setProducts(productsRes.data);
        
        let delay = 500;
        productsRes.data.forEach(p => {
          if (p.images && p.images.length > 0) {
            p.images.forEach(img => {
              const qty = img.quantity || 0;
              const variantName = img.color || 'Variant';
              
              if (qty === 0) {
                setTimeout(() => {
                  showAnimatedToast('Out of Stock', `"${p.name?.toUpperCase()}" (${variantName}) is out of stock.`, '🛑', 'red');
                }, delay);
                delay += 400;
              } else if (qty < 3) {
                setTimeout(() => {
                  showAnimatedToast('Low Stock Alert', `"${p.name?.toUpperCase()}" (${variantName}) has low stock (${qty} left).`, '⚠️', 'orange');
                }, delay);
                delay += 400;
              }
            });
          }
        });
      }
      if (transportersRes.success) setTransporters(transportersRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('An error occurred while loading dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  const buyersList = ['Kannan Silks', 'Sri Venkateswara Textiles', 'Royal Boutique', 'Kaveri Collections', 'Nandhini Fashions'];
  const getBuyerName = (order) => {
    if (order.remarks && buyersList.includes(order.remarks)) return order.remarks;
    return buyersList[order.id % buyersList.length];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">Confirmed</span>;
      case 'IN_PRODUCTION':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">In Production</span>;
      case 'SENT':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">Pending</span>;
      case 'DISPATCHED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-100">Shipped</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-600 border border-teal-100">Delivered</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  // Calculate stats
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter(o => o.status === 'ACCEPTED').length;
  const pendingShipments = orders.filter(o => o.status === 'SENT').length;
  const inProductionOrders = orders.filter(o => o.status === 'IN_PRODUCTION').length;
  const shippedOrders = orders.filter(o => o.status === 'DISPATCHED').length;
  const deliveredOrders = orders.filter(o => o.status === 'COMPLETED').length;
  const rejectedOrders = orders.filter(o => o.status === 'REJECTED').length;
  const totalInvoicesAmount = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  useEffect(() => {
    if (orders.length === 0) return;

    const timer = setTimeout(() => {
      const days = 20;
      const chartLabels = [];
      const totalCounts = [];
      const confirmedCounts = [];
      const revenueData = [];

      const sortedOrders = [...orders].sort((a, b) => new Date(a.date) - new Date(b.date));
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      for (let i = days - 1; i >= 0; i--) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - i);

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const day = targetDate.getDate();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const labelStr = (i === days - 1 || i % 5 === 0) ? `${day} ${monthNames[targetDate.getMonth()]}` : '';
        chartLabels.push(labelStr);

        const ordersOnOrBefore = sortedOrders.filter(o => new Date(o.date) <= targetDate);
        const ordersOnDay = sortedOrders.filter(o => {
          const d = new Date(o.date);
          return d >= startOfDay && d <= targetDate;
        });

        totalCounts.push(ordersOnOrBefore.length);
        confirmedCounts.push(ordersOnOrBefore.filter(o => o.status === 'ACCEPTED').length);

        // Cumulative revenue
        const cumRev = ordersOnOrBefore.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        revenueData.push(cumRev);
      }

      setLineChartData({
        labels: chartLabels,
        datasets: [
          {
            label: 'Total Orders',
            data: totalCounts,
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.04)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#2563EB',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: (ctx) => (ctx.dataIndex === 19 ? 6 : 0),
            pointHoverRadius: 6,
          },
          {
            label: 'Confirmed Orders',
            data: confirmedCounts,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.04)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: (ctx) => (ctx.dataIndex === 19 ? 6 : 0),
            pointHoverRadius: 6,
          }
        ]
      });

      setBarChartData({
        labels: chartLabels,
        datasets: [
          {
            label: 'Cumulative Revenue (INR)',
            data: revenueData,
            backgroundColor: '#8B5CF6',
            borderRadius: 4,
            hoverBackgroundColor: '#7C3AED',
          }
        ]
      });

      setDoughnutData({
        labels: ['Confirmed', 'Pending', 'In Prod.', 'Shipped', 'Delivered', 'Rejected'],
        datasets: [
          {
            data: [confirmedOrders, pendingShipments, inProductionOrders, shippedOrders, deliveredOrders, rejectedOrders],
            backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#14B8A6', '#F43F5E'],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6
          }
        ]
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [orders, confirmedOrders, pendingShipments, inProductionOrders, shippedOrders, deliveredOrders, rejectedOrders]);

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#94A3B8', font: { size: 12, weight: '500' } },
        grid: { color: '#F8FAFC' },
        border: { display: false }
      },
      x: {
        ticks: { color: '#94A3B8', font: { size: 12, weight: '500' }, maxRotation: 0 },
        grid: { display: false },
        border: { display: false }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const statuses = ['ACCEPTED', 'SENT', 'IN_PRODUCTION', 'DISPATCHED', 'COMPLETED', 'REJECTED'];
        setStatusFilter(statuses[index] === statusFilter ? null : statuses[index]);
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ${context.label}: ${context.parsed} Orders`
        }
      }
    }
  };

  const getUpcomingShipments = () => {
    const activeOrders = orders
      .filter(o => ['ACCEPTED', 'IN_PRODUCTION', 'SENT'].includes(o.status))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return activeOrders.map(o => {
      let offset = o.po_number === 'PO-2025-0876' ? 4 : o.po_number === 'PO-2025-0875' ? 7 : o.po_number === 'PO-2025-0874' ? 10 : 5 + (o.id % 4);
      const deliveryDate = new Date(new Date(o.date).setDate(new Date(o.date).getDate() + offset));
      const daysLeft = Math.ceil((deliveryDate - new Date()) / (1000 * 3600 * 24));

      return {
        id: o.id,
        shCode: o.po_number.replace('PO-', 'SH-'),
        buyer: getBuyerName(o),
        deliveryDate: formatDate(deliveryDate),
        daysLeft: daysLeft > 0 ? `${daysLeft} Days Left` : daysLeft === 0 ? 'Today' : 'Overdue',
        amount: o.total_amount
      };
    }).slice(0, 3);
  };

  // Filter recent orders
  const recentOrdersList = [...orders]
    .filter(o => statusFilter ? o.status === statusFilter : true)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7);

  const getPercent = (count) => totalOrders === 0 ? '0.0%' : `${((count / totalOrders) * 100).toFixed(1)}%`;

  const handleStatCardClick = (filterType) => {
    setStatusFilter(statusFilter === filterType ? null : filterType);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 font-sans">
      {loading ? (
        <FullDashboardSkeleton />
      ) : (
        <>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-semibold text-slate-800 tracking-tight">Welcome back, {user?.company_name}! 👋</h2>
          <p className="text-[15px] text-slate-500 mt-1.5 font-medium">Here's what's happening with your business today.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="flex items-center px-4 py-2 bg-white border border-slate-100 rounded-xl text-sm font-semibold text-slate-700  hover:bg-slate-50 hover:shadow-sm transition-all duration-200">
            <Calendar className="h-4 w-4 mr-2.5 text-slate-400" />
            {formatDate(new Date())}
            <ChevronDown className="h-4 w-4 ml-2.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={ClipboardList}
          colorClass="text-blue-600"
          bgColorClass="bg-blue-50/70"
          trend="up"
          trendValue="12.5%"
          sparklinePath="M0 25 Q 15 15, 30 22 T 60 10 T 90 20 T 100 8"
          onClick={() => handleStatCardClick(null)}
          isActive={statusFilter === null}
        />
        <StatCard
          title="Confirmed Orders"
          value={confirmedOrders}
          icon={Package}
          colorClass="text-emerald-500"
          bgColorClass="bg-emerald-50/70"
          trend="up"
          trendValue="18.7%"
          sparklinePath="M0 28 Q 15 28, 30 20 T 60 25 T 90 12 T 100 5"
          onClick={() => handleStatCardClick('ACCEPTED')}
          isActive={statusFilter === 'ACCEPTED'}
        />
        <StatCard
          title="Pending Shipments"
          value={pendingShipments}
          icon={Truck}
          colorClass="text-amber-500"
          bgColorClass="bg-amber-50/70"
          trend="down"
          trendValue="8.3%"
          sparklinePath="M0 20 Q 15 10, 30 22 T 60 8 T 90 24 T 100 18"
          onClick={() => handleStatCardClick('SENT')}
          isActive={statusFilter === 'SENT'}
        />
        <StatCard
          title="Total Invoices"
          value={formatCurrency(totalInvoicesAmount)}
          icon={Receipt}
          colorClass="text-purple-500"
          bgColorClass="bg-purple-50/70"
          trend="up"
          trendValue="15.4%"
          sparklinePath="M0 10 Q 15 25, 30 15 T 60 20 T 90 8 T 100 12"
          onClick={() => setChartView(chartView === 'revenue' ? 'orders' : 'revenue')}
          isActive={chartView === 'revenue'}
        />
        <StatCard
          title="Total Products"
          value={products.length}
          icon={Layers}
          colorClass="text-indigo-500"
          bgColorClass="bg-indigo-50/70"
          trend="up"
          trendValue="5.2%"
          sparklinePath="M0 25 Q 15 15, 30 20 T 60 15 T 90 22 T 100 10"
          onClick={() => { }}
          isActive={false}
        />
        <StatCard
          title="Total Transporters"
          value={transporters.length}
          icon={Users}
          colorClass="text-rose-500"
          bgColorClass="bg-rose-50/70"
          trend="up"
          trendValue="2.1%"
          sparklinePath="M0 15 Q 15 25, 30 18 T 60 10 T 90 25 T 100 20"
          onClick={() => { }}
          isActive={false}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Main Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 lg:col-span-2 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold text-slate-800 tracking-tight">
              {chartView === 'orders' ? 'Order Volume Trends' : 'Revenue Growth Overview'}
            </h3>

            <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <button
                onClick={() => setChartView('orders')}
                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${chartView === 'orders' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Orders
              </button>
              <button
                onClick={() => setChartView('revenue')}
                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${chartView === 'revenue' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Revenue
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-6 mb-6">
            {chartView === 'orders' ? (
              <>
                <div className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2 shadow-sm"></span>
                  <span className="text-[13px] font-semibold text-slate-600">Total Orders</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shadow-sm"></span>
                  <span className="text-[13px] font-semibold text-slate-600">Confirmed Orders</span>
                </div>
              </>
            ) : (
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2 shadow-sm"></span>
                <span className="text-[13px] font-semibold text-slate-600">Cumulative Revenue</span>
              </div>
            )}
          </div>

          <div className="h-[280px] w-full relative">
            {chartView === 'orders' ? (
              <Line data={lineChartData} options={commonChartOptions} />
            ) : (
              <Bar data={barChartData} options={commonChartOptions} />
            )}
          </div>
        </div>

        {/* Right: Interactive Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 lg:col-span-1 flex flex-col justify-between shadow-xs transition-shadow duration-300 relative overflow-hidden">
          {statusFilter && (
            <div className="absolute top-0 right-0 m-4 z-10">
              <button
                onClick={() => setStatusFilter(null)}
                className="flex items-center text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600 bg-slate-50 px-2 py-1 rounded-md"
              >
                Clear Filter <X className="h-3 w-3 ml-1" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold text-slate-800 tracking-tight">Order Distribution</h3>
          </div>

          <p className="text-[12px] text-slate-500 mb-2">Click segments to filter recent orders below.</p>

          <div className="flex flex-row items-center justify-between w-full h-[220px] my-2 cursor-pointer group">
            <div className="relative w-[140px] h-[140px] shrink-0 transition-transform duration-300 group-hover:scale-105">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-semibold text-slate-800 leading-none">{totalOrders}</span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider text-center mt-1">Orders</span>
              </div>
            </div>

            <div className="flex flex-col space-y-1.5 pl-4 flex-1 min-w-0 overflow-y-auto max-h-[220px] no-scrollbar">
              {[
                { label: 'Confirmed', count: confirmedOrders, color: 'bg-emerald-500', status: 'ACCEPTED' },
                { label: 'Pending', count: pendingShipments, color: 'bg-amber-500', status: 'SENT' },
                { label: 'In Production', count: inProductionOrders, color: 'bg-blue-500', status: 'IN_PRODUCTION' },
                { label: 'Shipped', count: shippedOrders, color: 'bg-purple-500', status: 'DISPATCHED' },
                { label: 'Delivered', count: deliveredOrders, color: 'bg-teal-500', status: 'COMPLETED' },
                { label: 'Rejected', count: rejectedOrders, color: 'bg-rose-500', status: 'REJECTED' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setStatusFilter(statusFilter === item.status ? null : item.status)}
                  className={`flex items-center justify-between text-[13px] p-1.5 rounded-lg cursor-pointer transition-colors
                    ${statusFilter === item.status ? 'bg-slate-100 ring-1 ring-slate-200' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center min-w-0 mr-2">
                    <span className={`w-2.5 h-2.5 rounded-full mr-2 shrink-0 shadow-sm ${item.color}`}></span>
                    <span className={`font-semibold truncate ${statusFilter === item.status ? 'text-slate-800' : 'text-slate-500'}`}>{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-1 whitespace-nowrap shrink-0">
                    <span className="font-bold text-slate-800">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tables and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Filterable Recent Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-100 lg:col-span-2 flex flex-col justify-between overflow-hidden shadow-xs">
          <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-white">
            <div className="flex items-center">
              <h3 className="text-[17px] font-semibold text-slate-800 tracking-tight mr-3">Recent Orders</h3>
              {statusFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-100">
                  <Filter className="h-3 w-3 mr-1" />
                  Filtered: {statusFilter.replace('_', ' ')}
                </span>
              )}
            </div>
            <button onClick={() => navigate('/orders')} className="text-[13px] font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors duration-150">
              View All Orders
            </button>
          </div>

          <div className="overflow-x-auto no-scrollbar flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="py-4 px-6 text-[14px] font-semibold text-slate-600">Order No.</th>
                  <th className="py-4 px-6 text-[14px] font-semibold text-slate-600">Buyer</th>
                  <th className="py-4 px-6 text-[14px] font-semibold text-slate-600">Order Date</th>
                  <th className="py-4 px-6 text-[14px] font-semibold text-slate-600">Amount</th>
                  <th className="py-4 px-6 text-[14px] font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {recentOrdersList.length > 0 ? (
                  recentOrdersList.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors duration-200 cursor-pointer group">
                      <td className="py-4 px-6 text-[13.5px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{row.po_number}</td>
                      <td className="py-4 px-6 text-[14px] font-semibold text-slate-600">{getBuyerName(row)}</td>
                      <td className="py-4 px-6 text-[13.5px] font-medium text-slate-400">{formatDate(row.date)}</td>
                      <td className="py-4 px-6 text-[14px] font-bold text-slate-800">{formatCurrency(row.total_amount)}</td>
                      <td className="py-4 px-6">{getStatusBadge(row.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400 text-[14px] font-medium">
                      <div className="flex flex-col items-center justify-center">
                        <Filter className="h-8 w-8 text-slate-200 mb-3" />
                        No orders match the selected filter.
                        {statusFilter && (
                          <button onClick={() => setStatusFilter(null)} className="mt-2 text-blue-500 hover:underline font-bold">Clear Filter</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Upcoming Shipments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 lg:col-span-1 flex flex-col justify-between shadow-xs  ">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[17px] font-semibold text-slate-800 tracking-tight">Upcoming Shipments</h3>
            <button onClick={() => navigate('/order-tracking')} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700">
              View All
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {getUpcomingShipments().length > 0 ? (
              getUpcomingShipments().map((shipment) => (
                <div key={shipment.id} className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 hover:shadow-sm transition-all duration-200 cursor-pointer">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <Box className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[13.5px] font-bold text-slate-800 leading-snug group-hover:text-blue-700 transition-colors">{shipment.shCode}</h4>
                      <p className="text-[12px] font-semibold text-slate-500 truncate mt-0.5">{shipment.buyer}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[12px] font-medium text-slate-400">{shipment.deliveryDate}</p>
                      <div className="flex items-center justify-end mt-1 space-x-2">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100">
                          {shipment.daysLeft}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-[14px] font-medium">
                No upcoming shipments.
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-4 flex items-center justify-between text-[13px]">
            <span className="text-slate-400 font-medium">© 2025 Kannan Silks</span>
            <div className="flex items-center text-blue-600 font-bold hover:underline cursor-pointer">
              <Headphones className="h-4 w-4 mr-1.5 shrink-0" />
              Support
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default SupplierDashboard;
