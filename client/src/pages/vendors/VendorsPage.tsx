import { useState, useEffect } from 'react';
import { vendorsApi } from '../../services/api';
import { VendorProfile, VendorType } from '../../types';
import { Search, UserCheck, MapPin, Phone, Star } from 'lucide-react';

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
          <Search size={20} />
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
            <UserCheck size={64} strokeWidth={1.5} />
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
                      <MapPin size={14} />
                      {[vendor.city, vendor.state].filter(Boolean).join(', ')}
                    </div>
                  )}

                  {vendor.businessPhone && (
                    <div className="vendor-phone">
                      <Phone size={14} />
                      {vendor.businessPhone}
                    </div>
                  )}

                  <div className="vendor-rating">
                    <Star size={14} fill="currentColor" />
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
