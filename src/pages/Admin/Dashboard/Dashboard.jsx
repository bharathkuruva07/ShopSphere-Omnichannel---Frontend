import React, { useMemo, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

import { ShoppingCart, Package, Users, TrendingUp, AlertCircle, Store, IndianRupee } from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
  const { dashboardData, fetchDashboardData, dashboardLoading, dashboardError } = useApp();

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Extract stats from backend responses
  const { orderStats, productStats, storeStats, campaignStats, campaigns } = dashboardData;

  // Derive chart-ready data from backend stats
  const stats = useMemo(() => {
    const totalRevenue = orderStats?.totalRevenue ?? 0;
    const totalOrders = orderStats?.totalOrders ?? 0;
    const totalProducts = productStats?.totalProducts ?? 0;
    const lowStockProducts = productStats?.lowStockProducts ?? 0;
    const outOfStockProducts = productStats?.outOfStockProducts ?? 0;
    const uniqueCustomers = orderStats?.uniqueCustomers ?? 0;
    const totalStores = storeStats?.totalStores ?? 0;
    const todayRevenue = orderStats?.todayRevenue ?? 0;
    const monthRevenue = orderStats?.monthRevenue ?? 0;

    const ordersByStatus = {
      pending: orderStats?.pendingOrders ?? 0,
      confirmed: orderStats?.confirmedOrders ?? 0,
      processing: orderStats?.processingOrders ?? 0,
      shipped: orderStats?.shippedOrders ?? 0,
      delivered: orderStats?.deliveredOrders ?? 0,
      cancelled: orderStats?.cancelledOrders ?? 0,
    };

    // Daily revenue from backend (already formatted as [{ date, revenue }])
    const dailyRevenue = orderStats?.dailyRevenue ?? [];

    // Top selling products from backend (already [{ name, sales }])
    const topProducts = orderStats?.topProducts ?? [];

    // Category distribution from product-service (already [{ name, value }])
    const categoryData = productStats?.categoryDistribution ?? [];

    // Campaign summary from campaign-service
    const campaignSummary = {
      totalCampaigns: campaignStats?.totalCampaigns ?? 0,
      totalBudget: campaignStats?.totalBudget ?? 0,
      totalCampaignRevenue: campaignStats?.totalRevenue ?? 0,
      overallROI: campaignStats?.overallROI ?? 0,
    };

    // Color palette for pie chart
    const colors = ['#667eea', '#03b00bff', '#f16100c3', '#9100d4ff', '#00f2fe'];

    // Campaign performance data for bar chart (Budget vs Revenue per campaign)
    const campaignPerformance = (campaigns || []).map(campaign => ({
      name: campaign.name,
      budgetSpent: Number(campaign.budget) || 0,
      revenueGenerated: Number(campaign.revenueGenerated) || 0,
    }));

    return {
      totalRevenue,
      todayRevenue,
      monthRevenue,
      totalOrders,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      uniqueCustomers,
      totalStores,
      ordersByStatus,
      dailyRevenue,
      topProducts,
      categoryData,
      campaignSummary,
      campaignPerformance,
      colors,
    };
  }, [orderStats, productStats, storeStats, campaignStats, campaigns]);

  // KPI stat cards
  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${Number(stats.totalRevenue).toFixed(0)}`,
      icon: IndianRupee,
      color: 'primary',
      change: `₹${Number(stats.todayRevenue).toFixed(0)} today`,
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'success',
      change: `${stats.ordersByStatus.delivered} delivered`,
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'info',
      change: `${stats.lowStockProducts} low stock`,
    },
    {
      title: 'Total Customers',
      value: stats.uniqueCustomers,
      icon: Users,
      color: 'warning',
      change: 'Active Users',
    },
  ];

  // Loading state
  if (dashboardLoading) {
    return (
      <div className="dashboard d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-secondary">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dashboardError) {
    return (
      <div className="dashboard" style={{ width: '600px', padding: '0 10px' }}>
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <AlertCircle size={32} />
          <div>
            <strong>Error loading dashboard:</strong><br /> {dashboardError}
            <button
              className="btn btn-sm btn-outline-danger ms-3"
              onClick={fetchDashboardData}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard" style={{ padding: '0 10px' }}>
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold mb-0">ShopSphere Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="col-xs-12 col-sm-6 col-lg-3">
              <div className="card stat-card p-3 border-0 shadow-medium">
                <div className="card-body p-1">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <p className="text-black fw-bold small mb-1">{stat.title}</p>
                      <h4 className="fw-bold mb-0">{stat.value}</h4>
                    </div>
                    <div className={`icon-badge bg-${stat.color} text-white p-3 rounded-circle`}>
                      <Icon size={54} />
                    </div>
                  </div>
                  <small className={`text-${stat.color} fw-bold`}>
                    <TrendingUp size={16} /> {stat.change}
                  </small>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Trend & Order Status */}
      <div className="row g-4 mb-5">
        {/* Revenue Trend (Line Chart) */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-medium">
            <div className="card-body p-2">
              <h5 className="fw-bold mb-4">Revenue Trend (Last 7 Days)</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#667eea"
                    strokeWidth={2}
                    dot={{ fill: '#667eea', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="col-lg-4">
          <div className="card border-0  shadow-medium">
            <div className="card-body p-2">
              <h5 className="fw-bold mb-4">Overall Orders Status</h5>
              <div className="status-list">
                <div className="status-item d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-secondary">Pending</span>
                  <span className="badge bg-warning">{stats.ordersByStatus.pending}</span>
                </div>
                <div className="status-item d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-secondary">Confirmed</span>
                  <span className="badge bg-primary">{stats.ordersByStatus.confirmed}</span>
                </div>
                <div className="status-item d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-secondary">Processing</span>
                  <span className="badge bg-secondary">{stats.ordersByStatus.processing}</span>
                </div>
                <div className="status-item d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-secondary">Shipped</span>
                  <span className="badge bg-info">{stats.ordersByStatus.shipped}</span>
                </div>
                <div className="status-item d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-secondary">Delivered</span>
                  <span className="badge bg-success">{stats.ordersByStatus.delivered}</span>
                </div>
                <div className="status-item d-flex justify-content-between align-items-center py-2">
                  <span className="text-secondary">Cancelled</span>
                  <span className="badge bg-danger">{stats.ordersByStatus.cancelled}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance Chart & Store Info */}
      <div className="row g-4 mb-5">
        {/* Campaign Performance Bar Chart */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-medium">
            <div className="card-body p-2">
              <h5 className="fw-bold mb-4">Campaign Performance (Budget vs Revenue)</h5>
              {stats.campaignPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.campaignPerformance} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis 
                      dataKey="name" 
                      angle={-25} 
                      textAnchor="end" 
                      height={70}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="budgetSpent" 
                      name="Budget Spent" 
                      fill="#e91e8ccc" 
                      radius={[5, 5, 0, 0]} 
                    />
                    <Bar 
                      dataKey="revenueGenerated" 
                      name="Revenue Generated" 
                      fill="#4ade80" 
                      radius={[5, 5, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5 text-secondary">
                  <AlertCircle size={48} className="mb-3 opacity-50" />
                  <p>No campaign data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Store Stats */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-medium mt-4">
            <div className="card-body p-1">
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <Store size={20} /> Store Overview
              </h5>
              <div className="p-4 bg-light rounded text-center">
                <p className="text-secondary small mb-1">Total Stores</p>
                <h2 className="fw-bold mb-0">{stats.totalStores}</h2>
              </div>
              <div className="mt-3 p-3 bg-light rounded text-center">
                <p className="text-secondary small mb-1">Month Revenue</p>
                <h4 className="fw-bold mb-0 text-primary">₹{Number(stats.monthRevenue).toFixed(0)}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products & Stock by Category */}
      <div className="row g-4">
        {/* Top Selling Products (Bar Chart) */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-medium">
            <div className="card-body p-2">
              <h5 className="fw-bold mb-4">Top Selling Products</h5>
              {stats.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.topProducts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Legend/>
                    <Tooltip />
                    <Bar dataKey="sales" fill="#ffc1158a" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5 text-secondary">
                  <Package size={48} className="mb-3 opacity-50" />
                  <p>No product sales data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stock by Category (Pie Chart) */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-medium">
            <div className="card-body p-1">
              <h5 className="fw-bold mb-4">Stock by Category</h5>
              {stats.categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#9fd884ff"
                      dataKey="value"
                    >
                      {stats.categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={stats.colors[index % stats.colors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5 text-secondary">
                  <AlertCircle size={48} className="mb-3 opacity-50" />
                  <p>No category data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;