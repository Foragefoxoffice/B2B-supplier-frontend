import React, { useState, useEffect } from 'react';
import { getStatsApi } from '../commonApi/api';
import {
  Users, ShoppingCart, Hourglass, CheckCircle,
  MoreVertical, Calendar, ArrowUp, ArrowDown,
  ChevronDown, ExternalLink, ArrowRight, Package, Box,
  HelpCircle
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

const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass, trend, trendValue }) => {
  const isPositive = trend === 'up';
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5 flex flex-col relative">
      <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
        <MoreVertical className="h-4 w-4" />
      </button>
      <div className="flex items-center mb-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center mr-4 ${bgColorClass} ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="text-2xl font-semibold text-slate-800 leading-none mt-1">{value}</h3>
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

const Dashboard = () => {
  const [loading, setLoading] = useState(false);

  // Read role to determine if Superadmin
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { first_name: 'Admin', role: 'SUPERADMIN' };

  // Use state for chart data to trigger animations from zero
  const [lineChartData, setLineChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'This Week',
        data: [0, 0, 0, 0, 0, 0, 0], // Start at 0 for animation
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
        data: [0, 0, 0, 0, 0, 0, 0], // Start at 0 for animation
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
        data: [0, 0, 0, 0, 0], // Start at 0 for animation
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

  useEffect(() => {
    // Trigger animation shortly after mount by setting actual data
    const timer = setTimeout(() => {
      setLineChartData({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'This Week',
            data: [28, 65, 72, 89, 52, 82, 20],
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
            data: [15, 42, 45, 48, 38, 60, 20],
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
            data: [28, 156, 62, 38, 28],
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
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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
        max: 100,
        ticks: { stepSize: 20, color: '#94A3B8', font: { size: 11, weight: '500' } },
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
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed;
            }
            return label;
          }
        }
      }
    }
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100/80">Confirmed</span>;
      case 'In Production': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100/80">In Production</span>;
      case 'Dispatched': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-100/80">Dispatched</span>;
      case 'Delivered': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100/80">Delivered</span>;
      default: return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200/80">{status}</span>;
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-slate-500">Loading Dashboard...</div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-[28px] font-semibold text-slate-900 tracking-tight">Welcome back, {user?.first_name}! 👋</h2>
          <p className="text-[15px] text-slate-500 mt-1 font-medium">Here's what's happening with your business today.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors">
            <Calendar className="h-4 w-4 mr-2 text-slate-500" />
            May 13, 2025 - May 19, 2025
            <ChevronDown className="h-4 w-4 ml-2 text-slate-500" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Suppliers"
          value="128"
          icon={Users}
          colorClass="text-indigo-600"
          bgColorClass="bg-indigo-100"
          trend="up"
          trendValue="8.5%"
        />
        <StatCard
          title="Active Orders"
          value="156"
          icon={ShoppingCart}
          colorClass="text-blue-600"
          bgColorClass="bg-blue-100"
          trend="up"
          trendValue="12.4%"
        />
        <StatCard
          title="Pending Orders"
          value="42"
          icon={Hourglass}
          colorClass="text-orange-500"
          bgColorClass="bg-orange-100"
          trend="down"
          trendValue="5.2%"
        />
        <StatCard
          title="Completed Orders"
          value="114"
          icon={CheckCircle}
          colorClass="text-emerald-500"
          bgColorClass="bg-emerald-100"
          trend="up"
          trendValue="15.3%"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-slate-800 mr-2">Purchase Orders Overview</h3>
              <HelpCircle className="h-4 w-4 text-slate-400" />
            </div>
            <button className="flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50">
              This Week
              <ChevronDown className="h-3 w-3 ml-1" />
            </button>
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
            <button className="flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50">
              This Week
              <ChevronDown className="h-3 w-3 ml-1" />
            </button>
          </div>

          <div className="relative h-[200px] w-full mb-6">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-semibold text-slate-500">Total</span>
              <span className="text-2xl font-bold text-slate-800">312</span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Draft', count: 28, percent: '9%', color: 'bg-indigo-500' },
              { label: 'Confirmed', count: 156, percent: '50%', color: 'bg-blue-500' },
              { label: 'In Production', count: 62, percent: '20%', color: 'bg-amber-500' },
              { label: 'Dispatched', count: 38, percent: '12%', color: 'bg-purple-500' },
              { label: 'Delivered', count: 28, percent: '9%', color: 'bg-emerald-500' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${item.color}`}></span>
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

      {/* Bottom Section: Tables and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Purchase Orders */}
        <div className="bg-white p-2 rounded-2xl shadow-xs border border-slate-100 lg:col-span-2">
          <div className="p-5 flex items-center justify-between border-b border-slate-100/80">
            <div>
              <h3 className="text-[17px] font-semibold text-slate-800 tracking-tight">Recent Purchase Orders</h3>
              <p className="text-[13px] text-slate-500 font-medium mt-0.5">Latest orders from your suppliers</p>
            </div>
            <button className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors duration-200">
              View All
            </button>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-3.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">PO Number</th>
                  <th className="py-3.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Supplier</th>
                  <th className="py-3.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Order Date</th>
                  <th className="py-3.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Delivery Date</th>
                  <th className="py-3.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="py-3.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {[
                  { po: 'PO-2025-0156', supplier: 'Shree Textiles Ltd.', oDate: 'May 19, 2025', dDate: 'May 26, 2025', status: 'Confirmed', amt: '₹2,45,000' },
                  { po: 'PO-2025-0155', supplier: 'Fashion Fabrics', oDate: 'May 18, 2025', dDate: 'May 25, 2025', status: 'In Production', amt: '₹1,85,500' },
                  { po: 'PO-2025-0154', supplier: 'Mahadev Prints', oDate: 'May 17, 2025', dDate: 'May 24, 2025', status: 'Dispatched', amt: '₹3,12,000' },
                  { po: 'PO-2025-0153', supplier: 'Naman Textiles', oDate: 'May 16, 2025', dDate: 'May 23, 2025', status: 'Confirmed', amt: '₹98,500' },
                  { po: 'PO-2025-0152', supplier: 'Vardhman Fashions', oDate: 'May 15, 2025', dDate: 'May 22, 2025', status: 'Delivered', amt: '₹1,65,000' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors duration-150 group">
                    <td className="py-4 px-5">
                      <span className="text-[13.5px] font-semibold text-slate-800">{row.po}</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold mr-3 border border-slate-200">
                          {row.supplier.charAt(0)}
                        </div>
                        <span className="text-[14px] font-semibold text-slate-700">{row.supplier}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-[13.5px] font-medium text-slate-500">{row.oDate}</td>
                    <td className="py-4 px-5 text-[13.5px] font-medium text-slate-500">{row.dDate}</td>
                    <td className="py-4 px-5">{getStatusBadge(row.status)}</td>
                    <td className="py-4 px-5 text-[14px] font-bold text-slate-800 text-right">{row.amt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-auto p-4 border-t border-slate-100 flex justify-center bg-slate-50/30">
            <button className="flex items-center text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors group">
              View All Purchase Orders
              <ArrowRight className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Column: Messages and Approvals */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Recent Messages */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Recent Messages</h3>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</button>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { name: 'Shree Textiles Ltd.', msg: 'Regarding the PO-2025-0156...', time: '10:30 AM', unread: true },
                { name: 'Fashion Fabrics', msg: 'Can we reschedule the delivery...', time: '09:15 AM', unread: true },
                { name: 'Mahadev Prints', msg: 'Invoice for PO-2025-0154...', time: 'Yesterday', unread: true },
                { name: 'Naman Textiles', msg: 'Thank you for the update.', time: 'Yesterday', unread: false },
              ].map((msg, idx) => (
                <div key={idx} className="p-4 flex items-start hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(msg.name)}&background=random&color=fff`}
                    alt={msg.name}
                    className="h-10 w-10 rounded-full shrink-0 mr-3"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-sm truncate ${msg.unread ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'}`}>
                        {msg.name}
                      </p>
                      <p className="text-xs font-medium text-slate-400 whitespace-nowrap ml-2">{msg.time}</p>
                    </div>
                    <p className={`text-sm truncate ${msg.unread ? 'font-medium text-slate-600' : 'text-slate-500'}`}>
                      {msg.msg}
                    </p>
                  </div>
                  {msg.unread && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 ml-3 shrink-0"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden flex-1">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Pending Approvals</h3>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer bg-slate-50/50 group">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center mr-3">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-0.5">Product Approval</h4>
                    <p className="text-xs font-medium text-slate-500">12 Products pending</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 -rotate-90 group-hover:text-slate-600" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer bg-slate-50/50 group">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-500 flex items-center justify-center mr-3">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-0.5">Supplier Registration</h4>
                    <p className="text-xs font-medium text-slate-500">5 Suppliers pending</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 -rotate-90 group-hover:text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
