import React, { useState, useEffect } from 'react';
import { getOrdersApi } from '../commonApi/api';
import {
  Calendar, ChevronDown, ArrowRight, Package, Box,
  HelpCircle, ClipboardList, Truck, Receipt, ChevronRight,
  Headphones
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass, trend, trendValue, sparklinePath }) => {
  const isPositive = trend === 'up';
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${bgColorClass} ${colorClass}`}>
            <Icon className="h-[22px] w-[22px]" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-500">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800 leading-none mt-1.5">{value}</h3>
          </div>
        </div>
        {/* Sparkline SVG */}
        <div className="w-16 h-8 shrink-0">
          <svg className={`w-full h-full ${colorClass}`} style={{ overflow: 'visible' }} viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <style>{`
              @keyframes draw-sparkline-svg {
                from {
                  stroke-dashoffset: 150;
                }
                to {
                  stroke-dashoffset: 0;
                }
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chart States initialized with 0 for entry animations
  const [lineChartData, setLineChartData] = useState({
    labels: Array(20).fill(''),
    datasets: [
      {
        label: 'Total Orders',
        data: Array(20).fill(0),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.04)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
      {
        label: 'Confirmed Orders',
        data: Array(20).fill(0),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.04)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
      }
    ]
  });

  const [doughnutData, setDoughnutData] = useState({
    labels: ['Confirmed', 'Pending', 'In Production', 'Shipped'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  });

  // Read user info
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { first_name: 'Ramesh', last_name: 'Kumar', role: 'SUPPLIER' };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await getOrdersApi();
      if (res.success) {
        setOrders(res.data);
      } else {
        setError('Failed to load dashboard statistics.');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('An error occurred while loading dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for buyer names from the screenshot
  const buyersList = ['Kannan Silks', 'Sri Venkateswara Textiles', 'Royal Boutique', 'Kaveri Collections', 'Nandhini Fashions'];
  const getBuyerName = (order) => {
    if (order.remarks && buyersList.includes(order.remarks)) {
      return order.remarks;
    }
    // Fallback based on order id
    return buyersList[order.id % buyersList.length];
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date: "20 May 2025"
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${monthName} ${year}`;
  };

  // Status Badge Component
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

  const totalInvoicesAmount = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  // Effect to trigger chart entry animations after orders are fetched
  useEffect(() => {
    if (orders.length === 0) return;

    const timer = setTimeout(() => {
      const days = 20;
      const chartLabels = [];
      const totalCounts = [];
      const confirmedCounts = [];

      const sortedOrders = [...orders].sort((a, b) => new Date(a.date) - new Date(b.date));

      for (let day = 1; day <= days; day++) {
        const labelStr = day === 1 || day === 5 || day === 10 || day === 15 || day === 20 ? `${day} May` : '';
        chartLabels.push(labelStr);

        const targetDate = new Date(`2025-05-${String(day).padStart(2, '0')}T23:59:59`);
        const ordersOnOrBefore = sortedOrders.filter(o => new Date(o.date) <= targetDate);
        const totalCount = ordersOnOrBefore.length;
        const confirmedCount = ordersOnOrBefore.filter(o => o.status === 'ACCEPTED').length;

        totalCounts.push(totalCount);
        confirmedCounts.push(confirmedCount);
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

      setDoughnutData({
        labels: ['Confirmed', 'Pending', 'In Production', 'Shipped'],
        datasets: [
          {
            data: [confirmedOrders, pendingShipments, inProductionOrders, shippedOrders],
            backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'],
            borderWidth: 0,
            hoverOffset: 4
          }
        ]
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [orders, confirmedOrders, pendingShipments, inProductionOrders, shippedOrders]);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
        max: 100,
        ticks: {
          stepSize: 20,
          color: '#94A3B8',
          font: { size: 12, weight: '500' }
        },
        grid: {
          color: '#F8FAFC',
        }
      },
      x: {
        ticks: {
          color: '#94A3B8',
          font: { size: 12, weight: '500' },
          autoSkip: false,
          maxRotation: 0,
        },
        grid: {
          display: false,
        }
      }
    }
  };



  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
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

  // Upcoming Shipments Calculator
  const getUpcomingShipments = () => {
    const activeOrders = orders
      .filter(o => o.status === 'ACCEPTED' || o.status === 'IN_PRODUCTION' || o.status === 'SENT')
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Closest first

    const shipments = activeOrders.map(o => {
      let offset = 4;
      if (o.po_number === 'PO-2025-0876') offset = 4;
      else if (o.po_number === 'PO-2025-0875') offset = 7;
      else if (o.po_number === 'PO-2025-0874') offset = 10;
      else {
        offset = 5 + (o.id % 4);
      }

      const orderDate = new Date(o.date);
      const deliveryDate = new Date(orderDate);
      deliveryDate.setDate(orderDate.getDate() + offset);

      const baseDate = new Date('2025-05-22');
      const timeDiff = deliveryDate.getTime() - baseDate.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return {
        id: o.id,
        shCode: o.po_number.replace('PO-', 'SH-'),
        buyer: getBuyerName(o),
        deliveryDate: formatDate(deliveryDate),
        daysLeft: daysLeft > 0 ? `${daysLeft} Days Left` : daysLeft === 0 ? 'Today' : 'Overdue',
        amount: o.total_amount
      };
    });

    return shipments.slice(0, 3);
  };

  // Get top 5 recent orders sorted by date desc
  const recentOrdersList = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const getPercent = (count) => {
    if (totalOrders === 0) return '0.0%';
    return `${((count / totalOrders) * 100).toFixed(1)}%`;
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 font-sans">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-semibold text-slate-800 tracking-tight">Welcome back, {user?.first_name} {user?.last_name}! 👋</h2>
          <p className="text-[15px] text-slate-500 mt-1.5 font-medium">Here's what's happening with your business today.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors duration-150 cursor-pointer">
            <Calendar className="h-4 w-4 mr-2.5 text-slate-400" />
            20 May 2025
            <ChevronDown className="h-4 w-4 ml-2.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={ClipboardList}
          colorClass="text-blue-600"
          bgColorClass="bg-blue-50/70"
          trend="up"
          trendValue="12.5%"
          sparklinePath="M0 25 Q 15 15, 30 22 T 60 10 T 90 20 T 100 8"
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
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Overview Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold text-slate-800 tracking-tight">Order Overview</h3>
            <button className="flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors duration-150 cursor-pointer">
              This Month
              <ChevronDown className="h-3 w-3 ml-1.5 text-slate-400" />
            </button>
          </div>

          {/* Custom Legend Header */}
          <div className="flex items-center space-x-6 mb-6">
            <div className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2"></span>
              <span className="text-[13px] font-semibold text-slate-600">Total Orders</span>
            </div>
            <div className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>
              <span className="text-[13px] font-semibold text-slate-600">Confirmed Orders</span>
            </div>
          </div>

          <div className="h-[280px] w-full relative">
            <Line data={lineChartData} options={lineChartOptions} />

            {totalOrders > 0 && (
              <div className="absolute right-0 top-0 h-full flex flex-col justify-between py-10 pointer-events-none pr-[2px]">
                <div className="bg-blue-600 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded shadow-sm leading-tight text-center">
                  {totalOrders}
                </div>
                <div className="bg-emerald-500 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded shadow-sm leading-tight text-center mt-20">
                  {confirmedOrders}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Status Distribution Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-semibold text-slate-800 tracking-tight">Order Status Distribution</h3>
            <button className="flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors duration-150 cursor-pointer">
              This Month
              <ChevronDown className="h-3 w-3 ml-1.5 text-slate-400" />
            </button>
          </div>

          <div className="flex flex-row items-center justify-between w-full h-[220px] my-4">
            <div className="relative w-[150px] h-[150px] shrink-0">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-slate-800 leading-none">{totalOrders}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center mt-1">Total Orders</span>
              </div>
            </div>

            <div className="flex flex-col space-y-3.5 pl-6 flex-1 min-w-0">
              {[
                { label: 'Confirmed', count: confirmedOrders, color: 'bg-emerald-500' },
                { label: 'Pending', count: pendingShipments, color: 'bg-amber-500' },
                { label: 'In Production', count: inProductionOrders, color: 'bg-blue-500' },
                { label: 'Shipped', count: shippedOrders, color: 'bg-purple-500' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center min-w-0 mr-2">
                    <span className={`w-2.5 h-2.5 rounded-full mr-2 shrink-0 ${item.color}`}></span>
                    <span className="font-semibold text-slate-500 truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-1 whitespace-nowrap shrink-0">
                    <span className="font-bold text-slate-800">{item.count}</span>
                    <span className="text-slate-400 font-medium">({getPercent(item.count)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tables and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-100 lg:col-span-2 flex flex-col justify-between overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-slate-100">
            <h3 className="text-[17px] font-semibold text-slate-800 tracking-tight">Recent Orders</h3>
            <button className="text-[13px] font-bold text-blue-600 bg-blue-50/70 hover:bg-blue-100/70 px-4 py-2 rounded-xl transition-colors duration-150 cursor-pointer">
              View All Orders
            </button>
          </div>

          <div className="overflow-x-auto no-scrollbar flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">Order No.</th>
                  <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">Buyer</th>
                  <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">Order Date</th>
                  <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">Amount</th>
                  <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {recentOrdersList.length > 0 ? (
                  recentOrdersList.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="py-4 px-6 text-[13.5px] font-bold text-slate-800">{row.po_number}</td>
                      <td className="py-4 px-6 text-[14px] font-semibold text-slate-600">{getBuyerName(row)}</td>
                      <td className="py-4 px-6 text-[13.5px] font-medium text-slate-400">{formatDate(row.date)}</td>
                      <td className="py-4 px-6 text-[14px] font-bold text-slate-800">{formatCurrency(row.total_amount)}</td>
                      <td className="py-4 px-6">{getStatusBadge(row.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 text-[14px] font-medium">
                      No purchase orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Upcoming Shipments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[17px] font-semibold text-slate-800 tracking-tight">Upcoming Shipments</h3>
            <button className="text-[13px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
              View All Shipments
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {getUpcomingShipments().length > 0 ? (
              getUpcomingShipments().map((shipment) => (
                <div key={shipment.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:shadow-xs transition-shadow duration-200">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-blue-50/70 text-blue-600 flex items-center justify-center shrink-0">
                      <Box className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[13.5px] font-bold text-slate-800 leading-snug">{shipment.shCode}</h4>
                      <p className="text-[12px] font-semibold text-blue-500 cursor-pointer hover:underline truncate mt-0.5">{shipment.buyer}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="text-right">
                      <p className="text-[12px] font-medium text-slate-400">{shipment.deliveryDate}</p>
                      <div className="flex items-center justify-end mt-1 space-x-2">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100">
                          {shipment.daysLeft}
                        </span>
                        <span className="text-[13.5px] font-bold text-slate-800">{formatCurrency(shipment.amount)}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-[14px] font-medium">
                No upcoming shipments.
              </div>
            )}
          </div>

          {/* Headset/Help section at bottom */}
          <div className="mt-8 border-t border-slate-100 pt-4 flex items-center justify-between text-[13px]">
            <span className="text-slate-400 font-medium">© 2025 Kannan Silks Supplier Portal. All rights reserved.</span>
            <div className="flex items-center text-blue-600 font-bold hover:underline cursor-pointer">
              <Headphones className="h-4 w-4 mr-1.5 shrink-0" />
              Contact Support
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
