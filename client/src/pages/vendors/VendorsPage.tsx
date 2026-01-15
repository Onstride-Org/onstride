import { useState, useEffect } from 'react';
import { vendorsApi } from '../../services/api';
import { VendorProfile, VendorType } from '../../types';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<VendorType | 'all'>('all');
  const [search, setSearch] = useState('');

  const loadVendors = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (search) params.search = search;

      const response = await vendorsApi.search(params);
      setVendors(response.data || []);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [typeFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadVendors();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const vendorTypes: { value: VendorType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'vet', label: 'Veterinarian' },
    { value: 'farrier', label: 'Farrier' },
    { value: 'dentist', label: 'Equine Dentist' },
    { value: 'bodyworker', label: 'Bodyworker' },
    { value: 'trainer', label: 'Trainer' },
    { value: 'supplier', label: 'Supplier' },
    { value: 'transport', label: 'Transport' },
    { value: 'photographer', label: 'Photographer' },
    { value: 'other', label: 'Other' },
  ];

  const getTypeLabel = (type: VendorType) => {
    const found = vendorTypes.find(t => t.value === type);
    return found?.label || type;
  };

  return (
    <div className="page vendors-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">Find and manage service providers</p>
        </div>
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
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
          />
        </div>
        <select
          className="form-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as VendorType | 'all')}
        >
          {vendorTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      ) : vendors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <path d="M16 11l2 2 4-4" />
            </svg>
          </div>
          <h3>No vendors found</h3>
          <p>
            {search || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No vendors available at this time'}
          </p>
        </div>
      ) : (
        <div className="vendor-grid">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="vendor-card">
              <div className="vendor-card-header">
                <div className="vendor-avatar">
                  {vendor.businessName.charAt(0).toUpperCase()}
                </div>
                <div className="vendor-header-info">
                  <h3 className="vendor-name">{vendor.businessName}</h3>
                  <span className="badge badge-outline">{getTypeLabel(vendor.primaryType)}</span>
                </div>
              </div>

              <div className="vendor-card-body">
                {vendor.description && (
                  <p className="vendor-description">{vendor.description}</p>
                )}

                <div className="vendor-details">
                  {(vendor.city || vendor.state) && (
                    <div className="vendor-location">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {[vendor.city, vendor.state].filter(Boolean).join(', ')}
                    </div>
                  )}

                  {vendor.businessPhone && (
                    <div className="vendor-phone">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {vendor.businessPhone}
                    </div>
                  )}

                  <div className="vendor-rating">
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {vendor.rating.toFixed(1)} ({vendor.reviewCount} reviews)
                  </div>
                </div>

                <div className="vendor-badges">
                  {vendor.acceptingNewClients && (
                    <span className="badge badge-success">Accepting Clients</span>
                  )}
                  {vendor.emergencyAvailable && (
                    <span className="badge badge-warning">Emergency Available</span>
                  )}
                </div>
              </div>

              <div className="vendor-card-actions">
                <button className="btn btn-outline btn-sm">View Profile</button>
                <button className="btn btn-primary btn-sm">Book Appointment</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
