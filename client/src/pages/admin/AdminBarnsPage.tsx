import { useState, useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import axios from 'axios';
import { getTokens, getCurrentBarn } from '../../services/api';
import {
  Building2, Search, ChevronRight, ChevronLeft, Shield, ArrowLeft, RefreshCw
} from 'lucide-react';

interface Barn {
  _id: string;
  name: string;
  ownerId?: { name: string; email: string };
  horseCount?: number;
  userCount?: number;
  createdAt: string;
}

export default function AdminBarnsPage() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [barns, setBarns] = useState<Barn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  if (user?.accountType !== 'admin') {
    return <Navigate to="/app/dashboard" replace />;
  }

  // Refresh when navigating back to this page (e.g. after add/delete on detail page)
  useEffect(() => {
    loadBarns();
  }, [page, search, location.key]);

  const loadBarns = async () => {
    try {
      setIsLoading(true);
      const { accessToken } = getTokens();
      const barnId = getCurrentBarn();
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
      if (barnId) headers['X-Barn-Id'] = barnId;

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiBase}/admin/barns`, {
        headers,
        params: { page, limit: 20, search: search || undefined },
      });

      setBarns(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to load barns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page admin-barns-page">
      <div className="page-header">
        <div>
          <Link to="/app/admin" className="btn btn-ghost btn-sm mb-2">
            <ArrowLeft size={16} />
            Back to Admin
          </Link>
          <h1 className="page-title">
            <Shield size={24} />
            Barn Management
          </h1>
          <p className="page-subtitle">Manage all platform barns</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => loadBarns()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="page-filters">
        <div className="search-input">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search barns..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="form-input"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      ) : barns.length === 0 ? (
        <div className="empty-state">
          <Building2 size={64} strokeWidth={1.5} />
          <h3>No barns found</h3>
          <p>Try adjusting your search</p>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Barn</th>
                    <th>Owner</th>
                    <th>Horses</th>
                    <th>Users</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {barns.map((barn) => (
                    <tr key={barn._id}>
                      <td>
                        <div className="barn-cell">
                          <span className="barn-avatar">
                            <Building2 size={20} />
                          </span>
                          <span className="barn-name">{barn.name}</span>
                        </div>
                      </td>
                      <td>
                        {barn.ownerId?.name || 'Unknown'}
                        <br />
                        <span className="text-muted text-sm">{barn.ownerId?.email}</span>
                      </td>
                      <td>{barn.horseCount || 0}</td>
                      <td>{barn.userCount || 0}</td>
                      <td>{new Date(barn.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/app/admin/barns/${barn._id}`} className="btn btn-ghost btn-sm">
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
