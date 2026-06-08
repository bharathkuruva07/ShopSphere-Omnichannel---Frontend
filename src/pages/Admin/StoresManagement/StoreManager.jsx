import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, Search, AlertCircle, Loader } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import "./StoreManager.css";

function StoreManager() {
  const {
    stores: contextStores,
    storesLoading,
    storesPagination: contextPagination,
    fetchStores: fetchStoresFromContext,
    createStore: createStoreFromContext,
    updateStore: updateStoreFromContext,
    deleteStore: deleteStoreFromContext,
  } = useApp();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
  });
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Sync context stores to local state
  useEffect(() => {
    setStores(contextStores);
  }, [contextStores]);

  useEffect(() => {
    setPagination(contextPagination);
  }, [contextPagination]);

  // Fetch stores on component mount
  useEffect(() => {
    fetchStores();
  }, [pagination.pageNumber]);

  /**
   * Fetch stores from API via AppContext
   */
  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchStoresFromContext({
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching stores");
      console.error("Fetch stores error:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate form data
   */
  const isFormComplete = (data) => {
    return Boolean(data.name && data.address && data.city);
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
    });
  };

  /**
   * Open modal for add/edit
   */
  const handleOpenModal = (store = null) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name || "",
        address: store.address || "",
        city: store.city || "",
      });
    } else {
      setEditingStore(null);
      resetForm();
    }
    setShowModal(true);
  };

  /**
   * Close modal
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStore(null);
    resetForm();
  };

  /**
   * Handle form input change
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  /**
   * Submit form for add/update
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormComplete(formData)) {
      setError("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editingStore) {
        // Update existing store
        const result = await updateStoreFromContext(
          editingStore.id,
          formData
        );
        if (result.success) {
          setStores(
            stores.map((s) =>
              s.id === editingStore.id ? result.data : s
            )
          );
          handleCloseModal();
        } else {
          setError(result.message || "Failed to update store");
        }
      } else {
        // Create new store
        const result = await createStoreFromContext(formData);
        if (result.success) {
          await fetchStores();
          handleCloseModal();
        } else {
          setError(result.message || "Failed to create store");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error saving store");
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle delete store
   */
  const handleDelete = async (store) => {
    if (
      !window.confirm(
        `Are you sure you want to delete store "${store.name}"?`
      )
    ) {
      return;
    }

    try {
      setError(null);
      const result = await deleteStoreFromContext(store.id);
      if (result.success) {
        setStores(stores.filter((s) => s.id !== store.id));
        setPagination({
          ...pagination,
          totalElements: pagination.totalElements - 1,
        });
      } else {
        setError(result.message || "Failed to delete store");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting store");
      console.error("Delete error:", err);
    }
  };

  /**
   * Filter stores based on search term
   */
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const name = store?.name || "";
      const address = store?.address || "";
      const searchLower = searchTerm.toLowerCase();
      return (
        name.toLowerCase().includes(searchLower) ||
        address.toLowerCase().includes(searchLower)
      );
    });
  }, [stores, searchTerm]);

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ padding: "0 40px" }} className="stores-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold">Store Management</h1>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => handleOpenModal()}
        >
          <Plus size={20} />
          Add Store
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* Search Filter */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <Search size={18} className="text-secondary" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search stores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stores Table */}
      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <Loader className="spinner" size={40} />
        </div>
      ) : (
        <div className="table-responsive card border-0 shadow-sm">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Store Name</th>
                <th>Address</th>
                <th>City</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.length > 0 ? (
                filteredStores.map((store) => (
                  <tr key={store.id}>
                    <td className="fw-600">{store.name}</td>
                    <td>{store.address}</td>
                    <td>{store.city}</td>
                    <td className="text-secondary small">
                      {formatDate(store.createdAt)}
                    </td>
                    <td className="text-secondary small">
                      {formatDate(store.updatedAt)}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleOpenModal(store)}
                        title="Edit store"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(store)}
                        title="Delete store"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-secondary">
                    {stores.length === 0 ? "No stores found" : "No results match your search"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Info */}
      {stores.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-4 text-secondary small">
          <span>
            Showing {filteredStores.length} of {pagination.totalElements} stores
          </span>
          {pagination.totalPages > 1 && (
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={pagination.pageNumber === 0}
                onClick={() =>
                  setPagination({
                    ...pagination,
                    pageNumber: pagination.pageNumber - 1,
                  })
                }
              >
                Previous
              </button>
              <span className="align-self-center">
                Page {pagination.pageNumber + 1} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={pagination.pageNumber >= pagination.totalPages - 1}
                onClick={() =>
                  setPagination({
                    ...pagination,
                    pageNumber: pagination.pageNumber + 1,
                  })
                }
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  {editingStore ? "Edit Store" : "Add New Store"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={submitting}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {/* Store Name */}
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label fw-600">
                      Store Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter store name"
                      disabled={submitting}
                      required
                    />
                  </div>

                  {/* Address */}
                  <div className="mb-3">
                    <label htmlFor="address" className="form-label fw-600">
                      Address <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter store address"
                      rows="3"
                      disabled={submitting}
                      required
                    />
                  </div>

                  {/* City */}
                  <div className="mb-3">
                    <label htmlFor="city" className="form-label fw-600">
                      City <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city name"
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader size={16} className="spinner me-2" />
                        Saving...
                      </>
                    ) : (
                      editingStore ? "Update Store" : "Add Store"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoreManager;
