import  { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Plus, Edit, Trash2, Search, AlertCircle, Upload, X } from 'lucide-react';
import { uploadImageToSupabase } from '../../../services/supabaseService';
import './ProductManager.css';

function ProductManager() {
  const { products, addProduct, updateProduct, deleteProduct, fetchProductsPage, searchProductsByTerm, getProductsByCategoryPaginated, productsLoading } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Electronics',
    stock: '',
    imageUrl: '',
    rating: '4.5'
  });

  const isFormComplete = (data) => {
    return Boolean(data.name && data.price !== '' && data.description && data.stock !== '' && data.imageUrl);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      category: 'Electronics',
      stock: '',
      imageUrl: '',
      rating: '4.5'
    });
    setImagePreview(null);
  };

  const categories = ['Electronics', 'Accessories', 'Fashion','Home & Living'];

  // Server-side products (current page)
  const [serverProducts, setServerProducts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);

  // Pagination state and derived values
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 10;

  const totalPages = Math.max(1, serverTotalPages);
  // Normalized page used for rendering (clamped between 1 and totalPages)
  const normalizedPage = Math.max(1, Math.min(currentPage, totalPages));

  const paginatedProducts = serverProducts; // server provides the current page

  // Fetch a page from backend using AppContext methods
  const fetchPage = async (page = 1) => {
    try {
      let response;
      
      if (searchTerm && searchTerm.trim() !== '') {
        // Call searchProductsByTerm from context
        response = await searchProductsByTerm(searchTerm.trim(), page, PRODUCTS_PER_PAGE);
      } else if (categoryFilter && categoryFilter !== 'All') {
        // Call getProductsByCategoryPaginated from context
        response = await getProductsByCategoryPaginated(categoryFilter, page, PRODUCTS_PER_PAGE);
      } else {
        // Call fetchProductsPage from context with no filters
        response = await fetchProductsPage(page, PRODUCTS_PER_PAGE, '', 'All');
      }

      const { content, totalElements: total, totalPages: totalP } = response;

      setServerProducts(content || []);
      setTotalElements(total || 0);
      setServerTotalPages(totalP || 1);
    } catch (err) {
      console.error('Failed to fetch products page', err);
    }
  };

  // Reset page when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  // Fetch page whenever currentPage, searchTerm, or categoryFilter change
  useEffect(() => {
    fetchPage(normalizedPage);
  }, [normalizedPage, searchTerm, categoryFilter]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setImagePreview(product.imageUrl);
      setFormData({
        ...product,
        price: product.price != null ? String(product.price) : '',
        stock: product.stock != null ? String(product.stock) : '',
        rating: product.rating != null ? String(product.rating) : '4.5'
      });
    } else {
      setEditingProduct(null);
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    setUploadingImage(true);
    const { url, error } = await uploadImageToSupabase(file, 'Inventory');
    setUploadingImage(false);

    if (error) {
      alert(`Image upload failed: ${error}`);
      setImagePreview(null);
      return;
    }

    if (url) {
      setFormData(prev => ({
        ...prev,
        imageUrl: url
      }));
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormComplete(formData)) {
      alert('Please fill all required fields');
      return;
    }

    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      rating: parseFloat(formData.rating)
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await addProduct(payload);
      }

      // Refresh current page from backend
      await fetchPage(normalizedPage);
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save product', err);
    }
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      (async () => {
        try {
          await deleteProduct(productId);
          await fetchPage(normalizedPage);
        } catch (err) {
          console.error('Failed to delete product', err);
        }
      })();
    }
  };

  return (
    <div style={{ padding: '0 40px' }} className="inventory-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold">Inventory Management</h1>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => handleOpenModal()}
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr className="border-bottom">
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {totalElements > 0 ? (
                  paginatedProducts.map(product => (
                    <tr key={product.id} className="align-middle">
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            style={{
                              width: '40px',
                              height: '40px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              marginRight: '10px'
                            }}
                          />
                          <div>
                            <p className="mb-0 fw-bold">{product.name}</p>
                            <small className="text-secondary">{product.description.substring(0, 30)}...</small>
                          </div>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td className="fw-bold text-primary">
                        ₹{product.price.toFixed(2)}
                      </td>
                      <td>
                        <input
                          type="number"
                          value={product.stock}
                          onChange={(e) => {
                            const newStock = parseInt(e.target.value) || 0;
                            (async () => {
                              try {
                                await updateProduct(product.id, { ...product, stock: newStock });
                                await fetchPage(normalizedPage);
                              } catch (err) {
                                console.error('Failed to update stock', err);
                              }
                            })();
                          }}
                          style={{ width: '80px' }}
                          min="0"
                          className="form-control form-control-sm"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          ⭐ {product.rating}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}`}
                        >
                          {product.stock > 10
                            ? 'In Stock'
                            : product.stock > 0
                              ? 'Low Stock'
                              : 'Out of Stock'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                            onClick={() => handleOpenModal(product)}
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <AlertCircle size={32} className="text-secondary mb-2 opacity-50 d-block mx-auto" />
                      <p className="text-secondary">No products found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalElements > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            <p className="mb-0 text-muted">Showing {totalElements === 0 ? 0 : (normalizedPage - 1) * PRODUCTS_PER_PAGE + 1} - {Math.min(normalizedPage * PRODUCTS_PER_PAGE, totalElements)} of {totalElements} products</p>
          </div>
          <nav>
            <ul className="pagination mb-0">
              <li className={`page-item ${normalizedPage === 1 ? 'disabled' : ''}`}>
                <button type="button" className="page-link" disabled={normalizedPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>Previous</button>
              </li>

              {/** Compact page number rendering with ellipsis */}
              {(() => {
                const pages = [];
                const maxButtons = 7;
                if (totalPages <= maxButtons) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  const left = Math.max(2, currentPage - 1);
                  const right = Math.min(totalPages - 1, currentPage + 1);

                  pages.push(1);
                  if (left > 2) pages.push('left-ellipsis');

                  for (let p = left; p <= right; p++) pages.push(p);

                  if (right < totalPages - 1) pages.push('right-ellipsis');
                  pages.push(totalPages);
                }

                return pages.map((item, idx) => {
                  if (item === 'left-ellipsis' || item === 'right-ellipsis') {
                    return (
                      <li key={item + idx} className="page-item disabled">
                        <span className="page-link">&hellip;</span>
                      </li>
                    );
                  }

                  const page = item;
                  return (
                    <li key={page} className={`page-item ${normalizedPage === page ? 'active' : ''}`}>
                      <button type="button" className="page-link" disabled={normalizedPage === page} onClick={() => setCurrentPage(page)}>{page}</button>
                    </li>
                  );
                });
              })()}

              <li className={`page-item ${normalizedPage === totalPages ? 'disabled' : ''}`}>
                <button type="button" className="page-link" disabled={normalizedPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>Next</button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                      required
                      className="form-control"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Price (₹) *</label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                          className="form-control"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Stock *</label>
                        <input
                          type="number"
                          name="stock"
                          value={formData.stock}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="0"
                          required
                          className="form-control"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Rating</label>
                    <input
                      type="number"
                      name="rating"
                      value={formData.rating}
                      onChange={handleInputChange}
                      min="1"
                      max="5"
                      step="0.1"
                      className="form-control"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description *</label>
                    <textarea
                      rows="3"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter product description"
                      required
                      className="form-control"
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Product Image *</label>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <input
                          type="file"
                          accept="image/*"
                          id="image-upload"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="form-control"
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('image-upload').click()}
                          disabled={uploadingImage}
                          className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                        >
                          <Upload size={18} />
                          {uploadingImage ? 'Uploading...' : 'Upload Image'}
                        </button>
                      </div>
                      <div className="col-md-6">
                        {imagePreview && (
                          <div className="position-relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              style={{
                                width: '100%',
                                height: '160px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '2px solid #e9ecef'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null);
                                setFormData(prev => ({ ...prev, imageUrl: '' }));
                              }}
                              className="btn btn-sm btn-danger position-absolute"
                              style={{ top: '5px', right: '5px' }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <small className="text-muted d-block mt-2">
                      Supported formats: JPG, PNG, WebP (Max 5MB)
                    </small>
                  </div>

                  <input
                    type="hidden"
                    name="imageUrl"
                    value={formData.imageUrl}
                  />
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManager;