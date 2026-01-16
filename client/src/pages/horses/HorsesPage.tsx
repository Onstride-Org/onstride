import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { horsesApi, usersApi } from '../../services/api';
import { Horse, User } from '../../types';
import { Plus, Search, X } from 'lucide-react';
import { HorseIcon } from '../../components/icons/HorseIcon';

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
          <Plus size={20} />
          Add Horse
        </button>
      </div>

      {/* Filters */}
      <div className="page-filters">
        <div className="search-input">
          <Search size={20} />
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
            <HorseIcon size={64} strokeWidth={1.5} />
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
                    {(horse.calculatedAge ?? horse.age) !== undefined && (
                      <span>{horse.calculatedAge ?? horse.age} yrs</span>
                    )}
                    {horse.sexStatus && <span>{horse.sexStatus.label}</span>}
                  </div>
                  {(horse.owner || horse.boarder) && (
                    <p className="horse-card-boarder">
                      Owner: {horse.owner?.name || horse.boarder?.name}
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
  // Default birthday to Jan 1st of current year
  const currentYear = new Date().getFullYear();
  const defaultBirthday = `${currentYear}-01-01`;

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthday, setBirthday] = useState(defaultBirthday);
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await usersApi.getAll({ limit: 100 });
        setUsers(response.data || []);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  // Calculate age from birthday
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = birthday ? calculateAge(birthday) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await horsesApi.create({
        name,
        breed: breed ? { value: breed.toLowerCase().replace(/\s+/g, '_'), label: breed } : undefined,
        birthday: birthday ? new Date(birthday).toISOString() : undefined,
        color: color || undefined,
        notes: notes || undefined,
        ownerId: ownerId || undefined,
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
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Horse</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
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
                <label htmlFor="birthday" className="form-label">Date of Birth</label>
                <input
                  type="date"
                  id="birthday"
                  className="form-input"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
                {age !== null && age >= 0 && (
                  <p className="form-hint">Age: {age} year{age !== 1 ? 's' : ''} old</p>
                )}
              </div>
            </div>

            <div className="form-row">
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

              <div className="form-group">
                <label htmlFor="owner" className="form-label">Owner / Responsible User</label>
                {isLoadingUsers ? (
                  <div className="spinner spinner-sm"></div>
                ) : (
                  <select
                    id="owner"
                    className="form-select"
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                  >
                    <option value="">Select owner (optional)...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.accountType})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes" className="form-label">Notes</label>
              <textarea
                id="notes"
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this horse..."
                rows={3}
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
