import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStatsApi, getOrdersApi, getSuppliersApi } from '../commonApi/api';
import { FullDashboardSkeleton } from '../components/common/SkeletonLoader';
import { useNotifications } from '../hooks/useNotifications';
import {
  Users, ShoppingCart, Hourglass, CheckCircle,
  MoreVertical, Calendar, ArrowUp, ArrowDown,
  ChevronDown, ArrowRight, Package, Box,
  HelpCircle, Bell, MessageSquare, Truck, AlertCircle, ClipboardList
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

const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass, trend, trendValue }) => {
  const isPositive = trend === 'up';
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5 flex flex-col relative">
      <div className="absolute top-4 right-4 group z-20">
        <button className="text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-50 p-1 -m-1 rounded-md transition-colors cursor-pointer" aria-label="More options">
          <MoreVertical className="h-4 w-4" />
        </button>
        {/* Invisible bridge to keep hover active */}
        <div className="absolute top-full right-0 w-10 h-2"></div>
        {/* Interactive Dropdown Menu */}
        <div className="absolute top-full right-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-32 bg-white border border-slate-100 rounded-xl shadow-lg shadow-slate-200/50 py-1.5 z-30 transform origin-top-right scale-95 group-hover:scale-100">
          <button className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer flex items-center">
            View Details
          </button>
          <button className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer flex items-center">
            Refresh Data
          </button>
          <div className="h-px bg-slate-100 my-1 mx-2"></div>
          <button className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer flex items-center">
            Hide Card
          </button>
        </div>
      </div>
      <div className="flex items-center mb-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center mr-4 ${bgColorClass} ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="text-2xl font-semibold text-slate-800 leading-none mt-1.5">{value}</h3>
        </div>
      </div>
      <div className="flex items-center mt-1 text-sm">
        <span className={`flex items-center font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
          {trendValue}
        </span>
        <span className="text-slate-400 ml-2 font-medium">from last week</span>
      </div>
    </div>
  );
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'NEW_PO':
    case 'order':
      return { icon: ShoppingCart, color: 'bg-blue-100 text-blue-600' };
    case 'PO_APPROVED':
    case 'product':
      return { icon: Package, color: 'bg-green-100 text-green-600' };
    case 'DISPATCH_UPDATED':
      return { icon: Truck, color: 'bg-purple-100 text-purple-600' };
    case 'NEW_MESSAGE':
      return { icon: MessageSquare, color: 'bg-orange-100 text-orange-600' };
    case 'alert':
      return { icon: AlertCircle, color: 'bg-rose-100 text-rose-600' };
    default:
      return { icon: Bell, color: 'bg-slate-100 text-slate-600' };
  }
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Read role to determine if Superadmin
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { first_name: 'Admin', role: 'SUPER_ADMIN' };
  const token = localStorage.getItem('token');
  const { notifications } = useNotifications(user, token);

  // Chart States initialized to 0 for entry animations
  const [lineChartData, setLineChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'This Week',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Last Week',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#6EE7B7',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      }
    ]
  });

  const [doughnutData, setDoughnutData] = useState({
    labels: ['Draft', 'Confirmed', 'In Production', 'Dispatched', 'Delivered'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          '#6366F1', // Draft (Indigo)
          '#3B82F6', // Confirmed (Blue)
          '#F59E0B', // In Production (Amber)
          '#8B5CF6', // Dispatched (Purple)
          '#10B981', // Delivered (Emerald)
        ],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  });

  const [topSuppliersData, setTopSuppliersData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Total Spend (₹)',
        data: [],
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        hoverBackgroundColor: 'rgba(37, 99, 235, 1)',
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 24,
      }
    ]
  });

  const [monthlySpendData, setMonthlySpendData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Monthly Spend (₹)',
        data: [],
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        hoverBackgroundColor: 'rgba(5, 150, 105, 1)',
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 24,
      }
    ]
  });

  useEffect(() => {
    fetchAdminDashboardData();
  }, []);

  const fetchAdminDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, suppliersRes, statsRes] = await Promise.all([
        getOrdersApi(),
        getSuppliersApi(),
        getStatsApi()
      ]);

      if (ordersRes.success) setOrders(ordersRes.data);
      if (suppliersRes.success) setSuppliers(suppliersRes.data);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError('An error occurred while loading admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Helper: group orders by day of week relative to the most recent order date in the database
  const getWeeklyOverview = (currentOrders) => {
    const thisWeekData = [0, 0, 0, 0, 0, 0, 0];
    const lastWeekData = [0, 0, 0, 0, 0, 0, 0];

    if (currentOrders.length === 0) {
      return { thisWeekData, lastWeekData };
    }

    const maxDate = new Date(Math.max(...currentOrders.map(o => new Date(o.date))));
    const focusDay = maxDate.getDay();
    const distanceToMonday = focusDay === 0 ? 6 : focusDay - 1;
    const startOfThisWeek = new Date(maxDate);
    startOfThisWeek.setDate(maxDate.getDate() - distanceToMonday);
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const endOfThisWeek = new Date(startOfThisWeek);
    endOfThisWeek.setDate(startOfThisWeek.getDate() + 7);

    currentOrders.forEach(o => {
      const orderDate = new Date(o.date);
      if (orderDate >= startOfThisWeek && orderDate < endOfThisWeek) {
        let dayIndex = orderDate.getDay() - 1;
        if (dayIndex === -1) dayIndex = 6;
        if (dayIndex >= 0 && dayIndex < 7) {
          thisWeekData[dayIndex]++;
        }
      } else if (orderDate >= startOfLastWeek && orderDate < startOfThisWeek) {
        let dayIndex = orderDate.getDay() - 1;
        if (dayIndex === -1) dayIndex = 6;
        if (dayIndex >= 0 && dayIndex < 7) {
          lastWeekData[dayIndex]++;
        }
      }
    });

    return { thisWeekData, lastWeekData };
  };

  // Effect to trigger entry animations after state is loaded
  useEffect(() => {
    if (orders.length === 0) return;

    const timer = setTimeout(() => {
      const { thisWeekData, lastWeekData } = getWeeklyOverview(orders);

      const draftCount = orders.filter(o => o.status === 'DRAFT').length;
      const confirmedCount = orders.filter(o => o.status === 'ACCEPTED').length;
      const productionCount = orders.filter(o => o.status === 'IN_PRODUCTION').length;
      const dispatchedCount = orders.filter(o => o.status === 'DISPATCHED').length;
      const deliveredCount = orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;

      setLineChartData({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'This Week',
            data: thisWeekData,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Last Week',
            data: lastWeekData,
            borderColor: '#6EE7B7',
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
          }
        ]
      });

      setDoughnutData({
        labels: ['Draft', 'Confirmed', 'In Production', 'Dispatched', 'Delivered'],
        datasets: [
          {
            data: [draftCount, confirmedCount, productionCount, dispatchedCount, deliveredCount],
            backgroundColor: [
              '#6366F1',
              '#3B82F6',
              '#F59E0B',
              '#8B5CF6',
              '#10B981',
            ],
            borderWidth: 0,
            hoverOffset: 4
          }
        ]
      });

      // Compute Top Suppliers by Spend
      const supplierTotals = {};
      orders.forEach(o => {
        const supplierName = o.supplier?.name || `Supplier #${o.supplier_id}`;
        const amount = parseFloat(o.total_amount) || 0;
        supplierTotals[supplierName] = (supplierTotals[supplierName] || 0) + amount;
      });

      const sortedSuppliers = Object.entries(supplierTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      setTopSuppliersData({
        labels: sortedSuppliers.map(s => s[0]),
        datasets: [
          {
            label: 'Total Spend (₹)',
            data: sortedSuppliers.map(s => s[1]),
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            hoverBackgroundColor: 'rgba(37, 99, 235, 1)',
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 24,
          }
        ]
      });

      // Compute Monthly Spend Trend
      const monthlyTotals = {};
      orders.forEach(o => {
        const date = new Date(o.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleString('default', { month: 'short' });
        const amount = parseFloat(o.total_amount) || 0;
        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = { label: monthName, value: 0 };
        }
        monthlyTotals[monthKey].value += amount;
      });

      const sortedMonthly = Object.entries(monthlyTotals)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6); // last 6 months

      setMonthlySpendData({
        labels: sortedMonthly.map(m => m[1].label),
        datasets: [
          {
            label: 'Monthly Spend (₹)',
            data: sortedMonthly.map(m => m[1].value),
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            hoverBackgroundColor: 'rgba(5, 150, 105, 1)',
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 24,
          }
        ]
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [orders]);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 5, color: '#94A3B8', font: { size: 11, weight: '500' } },
        grid: {
          color: '#F1F5F9',
          drawBorder: false,
        }
      },
      x: {
        ticks: { color: '#64748B', font: { size: 12, weight: '500' } },
        grid: { display: false, drawBorder: false }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#94A3B8',
          font: { size: 11, weight: '500' },
          callback: function (value) {
            if (value >= 100000) return '₹' + (value / 100000).toFixed(1) + 'L';
            if (value >= 1000) return '₹' + (value / 1000).toFixed(0) + 'K';
            return '₹' + value;
          }
        },
        grid: {
          color: '#F1F5F9',
          drawBorder: false,
        }
      },
      x: {
        ticks: { color: '#64748B', font: { size: 11, weight: '500' } },
        grid: { display: false, drawBorder: false }
      }
    }
  };

  // Status mapping counts for Doughnut chart
  const draftCount = orders.filter(o => o.status === 'DRAFT').length;
  const confirmedCount = orders.filter(o => o.status === 'ACCEPTED').length;
  const productionCount = orders.filter(o => o.status === 'IN_PRODUCTION').length;
  const dispatchedCount = orders.filter(o => o.status === 'DISPATCHED').length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;

  const totalOrdersCount = orders.length;

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1500,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.label || '';
            if (label) label += ': ';
            if (context.parsed !== null) label += context.parsed;
            return label;
          }
        }
      }
    }
  };

  const getPercent = (count) => {
    if (totalOrdersCount === 0) return '0%';
    return `${Math.round((count / totalOrdersCount) * 100)}%`;
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-slate-50 text-slate-500 border border-slate-200/50">Draft</span>;
      case 'SENT':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100/60">Sent</span>;
      case 'ACCEPTED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100/60">Confirmed</span>;
      case 'IN_PRODUCTION':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-amber-50 text-amber-600 border border-amber-100/60">In Production</span>;
      case 'DISPATCHED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-purple-50 text-purple-600 border border-purple-100/60">Dispatched</span>;
      case 'DELIVERED':
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-teal-50 text-teal-600 border border-teal-100/60">Delivered</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-rose-50 text-rose-600 border border-rose-100/60">Rejected</span>;
      case 'MODIFICATION_REQUESTED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-amber-50 text-amber-600 border border-amber-100/60">Mod. Requested</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-slate-50 text-slate-600 border border-slate-200/80">{status}</span>;
    }
  };

  // Currencies formatting
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
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    return `${months[d.getMonth()]} ${day}, ${d.getFullYear()}`;
  };

  const formatMessageTime = (dateString) => {
    const d = new Date(dateString);
    const today = new Date();
    const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    const isYesterday = d.getDate() === today.getDate() - 1 && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Yesterday';
    } else {
      return formatDate(dateString);
    }
  };

  const calculateTrend = (data, filterFn = () => true) => {
    if (!data || data.length === 0) return { trend: 'up', value: '0%' };

    const validDates = data
      .map(item => new Date(item.created_at || item.createdAt || item.date).getTime())
      .filter(t => !isNaN(t));
      
    if (validDates.length === 0) return { trend: 'up', value: '0%' };
    
    const latestDate = new Date(Math.max(...validDates));
    
    const now = latestDate;
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const twoWeeksAgo = new Date(oneWeekAgo);
    twoWeeksAgo.setDate(oneWeekAgo.getDate() - 7);

    let thisWeekCount = 0;
    let lastWeekCount = 0;

    data.forEach(item => {
      if (!filterFn(item)) return;
      const itemDate = new Date(item.created_at || item.createdAt || item.date);
      if (isNaN(itemDate.getTime())) return;
      
      if (itemDate > oneWeekAgo && itemDate <= now) {
        thisWeekCount++;
      } else if (itemDate > twoWeeksAgo && itemDate <= oneWeekAgo) {
        lastWeekCount++;
      }
    });

    if (lastWeekCount === 0) {
      if (thisWeekCount === 0) return { trend: 'up', value: '0%' };
      return { trend: 'up', value: '100%' };
    }

    const percentageChange = ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100;
    
    return {
      trend: percentageChange >= 0 ? 'up' : 'down',
      value: `${Math.abs(percentageChange).toFixed(1)}%`
    };
  };

  // Derived dashboard stats
  const activeOrdersCount = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'COMPLETED' && o.status !== 'REJECTED' && o.status !== 'DRAFT').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'SENT' || o.status === 'PENDING').length;
  const completedOrdersCount = orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;

  const suppliersTrend = calculateTrend(suppliers);
  const activeOrdersTrend = calculateTrend(orders, o => o.status !== 'DELIVERED' && o.status !== 'COMPLETED' && o.status !== 'REJECTED' && o.status !== 'DRAFT');
  const pendingOrdersTrend = calculateTrend(orders, o => o.status === 'SENT' || o.status === 'PENDING');
  const completedOrdersTrend = calculateTrend(orders, o => o.status === 'DELIVERED' || o.status === 'COMPLETED');

  const pendingProductsCount = stats?.pendingProducts || 0;
  const pendingSuppliersCount = suppliers.filter(s => s.status === 'PENDING').length;
  const recentMessages = stats?.recentMessages || [];

  const recentOrdersList = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-md text-center max-w-xl mx-auto my-12">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {loading ? (
        <FullDashboardSkeleton />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-[28px] font-semibold text-slate-900 tracking-tight">Welcome back, {user?.company_name}! 👋</h2>
              <p className="text-[15px] text-slate-500 mt-1 font-medium">Here's what's happening with your business today.</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Suppliers"
              value={stats?.totalSuppliers || suppliers.length}
              icon={Users}
              colorClass="text-indigo-600"
              bgColorClass="bg-indigo-100"
              trend={suppliersTrend.trend}
              trendValue={suppliersTrend.value}
            />
            <StatCard
              title="Active Orders"
              value={activeOrdersCount}
              icon={ShoppingCart}
              colorClass="text-blue-600"
              bgColorClass="bg-blue-100"
              trend={activeOrdersTrend.trend}
              trendValue={activeOrdersTrend.value}
            />
            <StatCard
              title="Pending Orders"
              value={pendingOrdersCount}
              icon={Hourglass}
              colorClass="text-orange-500"
              bgColorClass="bg-orange-100"
              trend={pendingOrdersTrend.trend}
              trendValue={pendingOrdersTrend.value}
            />
            <StatCard
              title="Completed Orders"
              value={completedOrdersCount}
              icon={CheckCircle}
              colorClass="text-emerald-500"
              bgColorClass="bg-emerald-100"
              trend={completedOrdersTrend.trend}
              trendValue={completedOrdersTrend.value}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Line Chart */}
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold text-slate-800 mr-2">Purchase Orders Overview</h3>
                  <div className="relative group flex items-center">
                    <HelpCircle className="h-4 w-4 text-slate-400 cursor-help hover:text-slate-600 transition-colors" />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 w-56 p-2.5 bg-slate-800 text-white text-xs rounded-lg shadow-xl font-medium text-center pointer-events-none">
                      Tracks the volume of purchase orders comparing the current week to the last week.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-5 border-x-transparent border-t-5 border-t-slate-800"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6 mb-4">
                <div className="flex items-center">
                  <span className="w-4 h-1 bg-[#10B981] rounded-full mr-2"></span>
                  <span className="text-sm font-semibold text-slate-600">This Week</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-0 border-t-2 border-dashed border-[#6EE7B7] mr-2"></span>
                  <span className="text-sm font-semibold text-slate-500">Last Week</span>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>

            {/* Doughnut Chart */}
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 lg:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Order Status Distribution</h3>
              </div>

              <div className="relative h-[200px] w-full mb-6">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-semibold text-slate-500">Total</span>
                  <span className="text-2xl font-bold text-slate-800">{totalOrdersCount}</span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Draft', count: draftCount, percent: getPercent(draftCount), color: 'bg-indigo-500' },
                  { label: 'Confirmed', count: confirmedCount, percent: getPercent(confirmedCount), color: 'bg-blue-500' },
                  { label: 'In Production', count: productionCount, percent: getPercent(productionCount), color: 'bg-amber-500' },
                  { label: 'Dispatched', count: dispatchedCount, percent: getPercent(dispatchedCount), color: 'bg-purple-500' },
                  { label: 'Delivered', count: deliveredCount, percent: getPercent(deliveredCount), color: 'bg-emerald-500' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <span className={`w-2.5 h-2.5 rounded-full mr-2 ${item.color}`}></span>
                      <span className="font-semibold text-slate-600">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-slate-800">{item.count}</span>
                      <span className="text-slate-400 font-medium w-8 text-right">({item.percent})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Report Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Suppliers Spend Bar Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mr-2">Top Suppliers by Spend</h3>
                  <p className="text-sm text-slate-400 font-medium mt-1">Spend distribution among your top 5 suppliers</p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full shrink-0 border border-blue-100">Top 5</span>
              </div>
              <div className="h-[280px] w-full mt-4">
                <Bar data={topSuppliersData} options={barChartOptions} />
              </div>
            </div>

            {/* Monthly Spend Bar Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mr-2">Monthly Purchase Order Trend</h3>
                  <p className="text-sm text-slate-400 font-medium mt-1">Aggregated spend trend over the last 6 months</p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-full shrink-0 border border-emerald-100">6 Months</span>
              </div>
              <div className="h-[280px] w-full mt-4">
                <Bar data={monthlySpendData} options={barChartOptions} />
              </div>
            </div>
          </div>

          {/* Bottom Section: Tables and Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Purchase Orders */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-2 flex flex-col justify-between">
              <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/30 via-transparent to-transparent">
                <div>
                  <h3 className="text-[20px] font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-blue-600 shrink-0" />
                    Recent Purchase Orders
                  </h3>
                  <p className="text-[14px] text-slate-400 font-medium mt-1">Latest orders from your suppliers</p>
                </div>
                <button onClick={() => navigate('/order-tracking')} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-2xs cursor-pointer">
                  View All
                </button>
              </div>
              <div className="overflow-x-auto no-scrollbar flex-1">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/60 border-b border-slate-100">
                      <th className="py-3.5 px-6 text-[14px] font-semibold text-slate-600">PO Number</th>
                      <th className="py-3.5 px-6 text-[14px] font-semibold text-slate-600">Supplier</th>
                      <th className="py-3.5 px-6 text-[14px] font-semibold text-slate-600">Order Date</th>
                      <th className="py-3.5 px-6 text-[14px] font-semibold text-slate-600">Delivery Date</th>
                      <th className="py-3.5 px-6 text-[14px] font-semibold text-slate-600">Status</th>
                      <th className="py-3.5 px-6 text-[14px] font-semibold text-slate-600 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {recentOrdersList.length > 0 ? (
                      recentOrdersList.map((row) => (
                        <tr key={row.id} onClick={() => navigate('/order-tracking')} className="hover:bg-slate-50/70 transition-all duration-200 cursor-pointer group/row">
                          <td className="py-4.5 px-6">
                            <span className="font-mono text-[12.5px] font-bold text-slate-700 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg group-hover/row:border-blue-200 group-hover/row:bg-blue-50/20 transition-colors">
                              {row.po_number}
                            </span>
                          </td>
                          <td className="py-4.5 px-6">
                            <div className="flex items-center">
                              <div className="flex flex-col">
                                <span className="text-[15px] font-semibold text-slate-700 leading-tight group-hover/row:text-blue-600 transition-colors">{row.supplier?.name}</span>
                                <span className="text-[11px] font-semibold text-slate-400 mt-0.5">{row.supplier?.supplier_code || 'SUP-000'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4.5 px-6">
                            <div className="flex items-center text-[13px] font-semibold text-slate-600">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400 shrink-0" />
                              {formatDate(row.date)}
                            </div>
                          </td>
                          <td className="py-4.5 px-6">
                            {row.delivery_date ? (
                              <div className="flex items-center text-[13px] font-semibold text-slate-600">
                                <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400 shrink-0" />
                                {formatDate(row.delivery_date)}
                              </div>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-slate-50 text-slate-400 border border-slate-200/50">
                                N/A
                              </span>
                            )}
                          </td>
                          <td className="py-4.5 px-6">{getStatusBadge(row.status)}</td>
                          <td className="py-4.5 px-6 text-right">
                            <span className="text-[14.5px] font-semibold text-slate-800 tracking-tight">
                              {formatCurrency(row.total_amount)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400 text-sm font-medium">
                          No purchase orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-auto p-4 border-t border-slate-100 flex justify-center bg-slate-50/30">
                <button onClick={() => navigate('/order-tracking')} className="flex items-center text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors group">
                  View All Purchase Orders
                  <ArrowRight className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Column: Notifications and Approvals */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              {/* Recent Notifications */}
              <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Recent Notifications</h3>
                  <button onClick={() => navigate('/notifications')} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</button>
                </div>
                <div className="divide-y divide-slate-100">
                  {notifications && notifications.length > 0 ? (
                    notifications.slice(0, 4).map((notif) => {
                      const { icon: Icon, color } = getNotificationIcon(notif.type);
                      const isUnread = !notif.is_read;
                      return (
                        <div key={notif.id} onClick={() => navigate('/notifications')} className="p-4 flex items-start hover:bg-slate-50/50 transition-colors cursor-pointer">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mr-3 ${color}`}>
                            <Icon className="h-[18px] w-[18px]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className={`text-sm truncate ${isUnread ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs font-medium text-slate-400 whitespace-nowrap ml-2">{formatMessageTime(notif.created_at)}</p>
                            </div>
                            <p className={`text-sm truncate ${isUnread ? 'font-medium text-slate-600' : 'text-slate-500'}`}>
                              {notif.message}
                            </p>
                          </div>
                          {isUnread && (
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 ml-3 shrink-0"></div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-sm font-medium">
                      No recent notifications.
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden flex-1">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Pending Approvals</h3>
                  <button onClick={() => navigate('/dashboard')} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</button>
                </div>
                <div className="p-5 space-y-4">
                  <div onClick={() => navigate('/products')} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer bg-slate-50/50 group">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center mr-3">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-0.5">Product Approval</h4>
                        <p className="text-xs font-medium text-slate-500">{pendingProductsCount} Products pending</p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 -rotate-90 group-hover:text-slate-600" />
                  </div>

                  <div onClick={() => navigate('/suppliers')} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer bg-slate-50/50 group">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-500 flex items-center justify-center mr-3">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-0.5">Supplier Registration</h4>
                        <p className="text-xs font-medium text-slate-500">{pendingSuppliersCount} Suppliers pending</p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 -rotate-90 group-hover:text-slate-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
