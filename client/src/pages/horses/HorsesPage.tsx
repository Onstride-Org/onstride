import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { horsesApi } from '../../services/api';
import { Horse } from '../../types';

export default function HorsesPage() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const loadHorses = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: pagination.page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await horsesApi.getAll(params);
      setHorses(response.data || []);
      setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Failed to load horses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHorses();
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (pagination.page === 1) {
        loadHorses();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <div className="page horses-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Horses</h1>
          <p className="page-subtitle">{pagination.total} horses in your barn</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Horse
        </button>
      </div>

      {/* Filters */}
      <div className="page-filters">
        <div className="search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search horses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active
          </button>
          <button
            className={`filter-tab ${statusFilter === 'inactive' ? 'active' : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      ) : horses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 9s-2-2-4-2c-1 0-2 1-3 2l-2 2-4-1-5 5v5h4l2-3 4-1 3 4h3v-4l2-4z" />
            </svg>
          </div>
          <h3>No horses found</h3>
          <p>
            {search || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first horse to get started'}
          </p>
          {!search && statusFilter === 'all' && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              Add Horse
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="horse-grid">
            {horses.map((horse) => (
              <Link key={horse.id} to={`/horses/${horse.id}`} className="horse-card">
                <div className="horse-card-avatar">
                  {horse.name.charAt(0).toUpperCase()}
                </div>
                <div className="horse-card-content">
                  <h3 className="horse-card-name">{horse.name}</h3>
                  <p className="horse-card-breed">
                    {horse.breed?.label || 'Unknown breed'}
                  </p>
                  <div className="horse-card-meta">
                    {horse.age && <span>{horse.age} yrs</span>}
                    {horse.sexStatus && <span>{horse.sexStatus.label}</span>}
                  </div>
                  {horse.boarder && (
                    <p className="horse-card-boarder">
                      Owner: {horse.boarder.name}
                    </p>
                  )}
                </div>
                <span className={`badge badge-${horse.status === 'active' ? 'success' : 'neutral'}`}>
                  {horse.status}
                </span>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="btn btn-outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Horse Modal */}
      {showAddModal && (
        <AddHorseModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadHorses();
          }}
        />
      )}
    </div>
  );
}

interface AddHorseModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddHorseModal({ onClose, onSuccess }: AddHorseModalProps) {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [color, setColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await horsesApi.create({
        name,
        breed: breed ? { value: breed.toLowerCase().replace(/\s+/g, '_'), label: breed } : undefined,
        age: age ? parseInt(age) : undefined,
        color: color || undefined,
        status: 'active',
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create horse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Horse</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name" className="form-label">Name *</label>
              <input
                type="text"
                id="name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Horse name"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="breed" className="form-label">Breed</label>
                <input
                  type="text"
                  id="breed"
                  className="form-input"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="e.g., Thoroughbred"
                />
              </div>

              <div className="form-group">
                <label htmlFor="age" className="form-label">Age</label>
                <input
                  type="number"
                  id="age"
                  className="form-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Years"
                  min="0"
                  max="50"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="color" className="form-label">Color</label>
              <input
                type="text"
                id="color"
                className="form-input"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g., Bay, Chestnut, Gray"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  Adding...
                </>
              ) : (
                'Add Horse'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
