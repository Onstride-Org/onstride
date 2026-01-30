import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import axios from 'axios';
import { getTokens, getCurrentBarn } from '../../services/api';
import {
  Users, Search, ChevronRight, ChevronLeft, Shield, ArrowLeft
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  accountType: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  if (user?.accountType !== 'admin') {
    return <Navigate to="/app/dashboard" replace />;
  }

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const { accessToken } = getTokens();
      const barnId = getCurrentBarn();
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
      if (barnId) headers['X-Barn-Id'] = barnId;

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiBase}/admin/users`, {
        headers,
        params: { page, limit: 20, search: search || undefined },
      });

      setUsers(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page admin-users-page">
      <div className="page-header">
        <div>
          <Link to="/app/admin" className="btn btn-ghost btn-sm mb-2">
            <ArrowLeft size={16} />
            Back to Admin
          </Link>
          <h1 className="page-title">
            <Shield size={24} />
            User Management
          </h1>
          <p className="page-subtitle">Manage all platform users</p>
        </div>
      </div>

      <div className="page-filters">
        <div className="search-input">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search users..."
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
      ) : users.length === 0 ? (
        <div className="empty-state">
          <Users size={64} strokeWidth={1.5} />
          <h3>No users found</h3>
          <p>Try adjusting your search</p>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Verified</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-cell">
                          <span className="user-avatar">
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                          <span className="user-name">{u.name}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge badge-${u.accountType === 'admin' ? 'error' : u.accountType === 'owner' ? 'brand' : 'neutral'}`}>
                          {u.accountType}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${u.emailVerified ? 'success' : 'warning'}`}>
                          {u.emailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/app/admin/users/${u._id}`} className="btn btn-ghost btn-sm">
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
