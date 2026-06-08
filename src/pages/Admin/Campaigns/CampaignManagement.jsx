import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Plus, BarChart3, TrendingUp, Trash2, Search, CheckCircle, Edit3 } from 'lucide-react';
import CampaignReport from './CampaignReport';
import './CampaignManagement.css';

function CampaignManagement() {
  // Get campaign state and methods from context
  const {
    campaigns,
    campaignsLoading,
    campaignStats,
    campaignPagination,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    addCampaignRevenue,
  } = useApp();

  // UI State
  const [selectedReport, setSelectedReport] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [targetCampaign, setTargetCampaign] = useState(null);
  const [additionalRevenue, setAdditionalRevenue] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '', targetAudience: '', budget: '', startDate: '', endDate: ''
  });

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns(0, campaignPagination.pageSize);
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchCampaigns(newPage, campaignPagination.pageSize);
  };

  // Calculate overall ROI from stats
  const overallROIPercent = campaignStats.totalBudget > 0
    ? ((campaignStats.totalRevenue - campaignStats.totalBudget) / campaignStats.totalBudget) * 100
    : 0;

  // Local Filtering for the current page
  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter(c => {
        const matchesFilter = filterStatus === 'All' || c.status === filterStatus;
        const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.targetAudience?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt));
  }, [campaigns, filterStatus, searchTerm]);

  // Handlers
  const handleEditClick = (camp) => {
    setFormData({ ...camp });
    setIsEditing(true);
    setShowCreateModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateCampaign(formData.id, formData);
        triggerToast("Campaign updated successfully!");
      } else {
        await createCampaign(formData);
        triggerToast("New campaign launched!");
      }
      closeFormModal();
    } catch (err) {
      alert(err.message || "Operation failed");
    }
  };

  const handleDelete = async (camp) => {
    if (window.confirm(`Delete "${camp.name}"?`)) {
      try {
        await deleteCampaign(camp.id);
        triggerToast("Campaign deleted.");
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  const handleAddRevenue = async () => {
    try {
      await addCampaignRevenue(targetCampaign, additionalRevenue);
      setShowRevenueModal(false);
      setAdditionalRevenue('');
      triggerToast("Revenue added successfully!");
    } catch (err) {
      alert("Failed to add revenue");
    }
  };

  const closeFormModal = () => {
    setShowCreateModal(false);
    setIsEditing(false);
    setFormData({ name: '', targetAudience: '', budget: '', startDate: '', endDate: '' });
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Show report view
  if (selectedReport) {
    return <CampaignReport campaign={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  return (
    <div className="p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>

      {/* Success Notification */}
      {showToast && (
        <div className="toast-container position-fixed top-0 start-50 translate-middle-x p-3" style={{ zIndex: 1100 }}>
          <div className="toast show align-items-center text-white bg-success border-0 shadow" role="alert">
            <div className="d-flex">
              <div className="toast-body d-flex align-items-center gap-2">
                <CheckCircle size={18} /> {toastMsg}
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setShowToast(false)}></button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {campaignsLoading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
             style={{ backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 1050 }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold h3 mb-0">Marketing Campaigns</h1>
        <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm" onClick={() => { setIsEditing(false); setShowCreateModal(true); }}>
          <Plus size={18} /> Launch Campaign
        </button>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-4 h-100">
            <div className="text-muted small fw-bold mb-2 text-uppercase">Total Budget</div>
            <h3 className="fw-bold mb-0">₹{Number(campaignStats.totalBudget || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>
        <div className="col-md-4 text-center">
          <div className="card border-0 shadow-sm p-4 bg-white h-100">
            <TrendingUp size={28} className="text-primary mx-auto mb-2" />
            <small className="text-muted fw-bold d-block mb-1">OVERALL ROI %</small>
            <h4 className={`fw-bold mb-0 ${overallROIPercent >= 0 ? 'text-success' : 'text-danger'}`}>
              {overallROIPercent.toFixed(1)}%
            </h4>
          </div>
        </div>
        <div className="col-md-4 text-md-end">
          <div className="card border-0 shadow-sm p-4 h-100">
            <div className="text-muted small fw-bold mb-2 text-uppercase">Total Campaigns</div>
            <h3 className="fw-bold text-primary mb-0">{campaignStats.totalCampaigns || campaigns.length}</h3>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="row mb-4 g-3">
        <div className="col-md-8">
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0"><Search size={18} className="text-muted" /></span>
            <input type="text" className="form-control border-start-0" placeholder="Search campaigns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="col-md-4">
          <select className="form-select shadow-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* CAMPAIGN DATA TABLE */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table align-middle table-hover mb-0">
            <thead className="bg-light text-uppercase small fw-bold text-muted">
              <tr>
                <th>Campaign Details</th>
                <th>Status</th>
                <th>Revenue</th>
                <th className="text-center">Quick Action</th>
                <th className="text-end">Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map(camp => (
                <tr key={camp.id} className={camp.status === 'COMPLETED' ? 'opacity-75' : ''}>
                  <td>
                    <div className="fw-bold">{camp.name}</div>
                    <small className="text-muted">{camp.endDate}</small>
                  </td>
                  <td>
                    <span className={`badge ${camp.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                      {camp.status === 'ACTIVE' ? 'Active' : camp.status === 'COMPLETED' ? 'Completed' : camp.status}
                    </span>
                  </td>
                  <td className="text-primary fw-bold">₹{Number(camp.revenueGenerated || 0).toLocaleString()}</td>
                  <td className="text-center">
                    {/* DISABLED LOGIC ADDED HERE */}
                    <button
                      className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                      onClick={() => { setTargetCampaign(camp); setAdditionalRevenue(''); setShowRevenueModal(true); }}
                      disabled={camp.status === 'COMPLETED'} // Disable if completed
                      title={camp.status === 'COMPLETED' ? "Cannot add revenue to a completed campaign" : "Add Revenue"}
                    >
                      {camp.status === 'COMPLETED' ? (
                        <><CheckCircle size={14} /> Finalized</>
                      ) : (
                        <><Plus size={14} /> Add Revenue</>
                      )}
                    </button>
                  </td>
                  <td className="text-end">
                    {/* ... Manage Buttons remain enabled so you can still view Reports or Delete ... */}
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-sm btn-info text-white shadow-sm" title="Report" style={{ backgroundColor: '#066ba5ff', borderColor: '#6f42c1' }} onClick={() => setSelectedReport(camp)}>
                        <BarChart3 size={16} />
                      </button>
                      <button className="btn btn-sm btn-warning text-dark shadow-sm" title="Edit" style={{ backgroundColor: '#9783b9ff', borderColor: '#6f42c1' }} onClick={() => handleEditClick(camp)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="btn btn-sm btn-outline-danger shadow-sm" title="Delete" onClick={() => handleDelete(camp)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="d-flex justify-content-between align-items-center p-3 border-top bg-white">
          <small className="text-muted">Page {campaignPagination.currentPage + 1} of {Math.max(1, campaignPagination.totalPages)}</small>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${campaignPagination.currentPage === 0 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(campaignPagination.currentPage - 1)}>Prev</button>
              </li>
              {[...Array(Math.max(1, campaignPagination.totalPages))].map((_, i) => (
                <li key={i} className={`page-item ${campaignPagination.currentPage === i ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(i)}>{i + 1}</button>
                </li>
              ))}
              <li className={`page-item ${campaignPagination.currentPage >= campaignPagination.totalPages - 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(campaignPagination.currentPage + 1)}>Next</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* CAMPAIGN FORM MODAL (CREATE/EDIT) */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content border-0 shadow-lg" onSubmit={handleFormSubmit}>
              <div className="modal-header border-0 pb-0">
                <h5 className="fw-bold m-0 text-primary">{isEditing ? 'Edit Campaign Data' : 'Launch New Campaign'}</h5>
                <button type="button" className="btn-close" onClick={closeFormModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="small fw-bold text-muted mb-1">Campaign Name</label>
                  <input className="form-control" value={formData.name} required onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="small fw-bold text-muted mb-1">Target Audience</label>
                  <input className="form-control" value={formData.targetAudience} required onChange={e => setFormData({ ...formData, targetAudience: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="small fw-bold text-muted mb-1">Budget Amount (₹)</label>
                  <input className="form-control" type="number" value={formData.budget} required onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="small fw-bold text-muted mb-1">Start Date</label>
                    <input 
                      className="form-control" 
                      type="date" 
                      value={formData.startDate} 
                      min={new Date().toISOString().split('T')[0]}
                      required 
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })} 
                    />
                  </div>
                  <div className="col-6">
                    <label className="small fw-bold text-muted mb-1">End Date</label>
                    <input 
                      className="form-control" 
                      type="date" 
                      value={formData.endDate} 
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      required 
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-light" onClick={closeFormModal}>Cancel</button>
                <button type="submit" className="btn btn-primary px-4 fw-bold">
                  {isEditing ? 'Save Changes' : 'Confirm & Launch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVENUE ACCUMULATOR MODAL */}
      {showRevenueModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg p-3">
              <div className="modal-header border-0 pb-0 text-center d-block">
                <h5 className="fw-bold m-0">Manual Revenue Entry</h5>
                <p className="small text-muted mb-0">{targetCampaign?.name}</p>
              </div>
              <div className="modal-body pt-4 text-center">
                <div className="p-3 bg-light rounded mb-4">
                  <div className="text-muted small">Existing Total</div>
                  <div className="h4 fw-bold mb-0 text-primary">₹{targetCampaign?.revenueGenerated?.toLocaleString()}</div>
                </div>
                <div className="text-start mb-2"><label className="small fw-bold">Add New Amount</label></div>
                <div className="input-group input-group-lg mb-3">
                  <span className="input-group-text bg-white border-end-0 text-success fw-bold">₹</span>
                  <input
                    type="number"
                    className="form-control border-start-0 ps-0"
                    value={additionalRevenue}
                    placeholder="0.00"
                    onChange={e => setAdditionalRevenue(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <button className="btn btn-outline-secondary w-100 py-2" onClick={() => setShowRevenueModal(false)}>Cancel</button>
                  </div>
                  <div className="col-6">
                    <button className="btn btn-success w-100 py-2 fw-bold" onClick={handleAddRevenue}>Add Revenue</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignManagement;