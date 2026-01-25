import { useState, useEffect } from 'react';
import { vendorsApi, horsesApi } from '../../services/api';
import { VendorProfile, VendorType, VendorAppointment, Horse } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { format } from 'date-fns';
import {
  Search, UserCheck, MapPin, Phone, Star, X, Calendar, Clock,
  CheckCircle, XCircle
} from 'lucide-react';
import FilterTabs from '../../components/FilterTabs';
import { formatPhoneNumber } from '../../utils/formatters';

type TabType = 'directory' | 'connections' | 'appointments';

export default function VendorsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('directory');
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<VendorAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<VendorType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showWipNotice, setShowWipNotice] = useState(() => {
    // Show notice if not dismissed before
    return !sessionStorage.getItem('vendors_wip_dismissed');
  });

  // Modal states
  const [showVendorDetail, setShowVendorDetail] = useState<VendorProfile | null>(null);
  const [showBookingModal, setShowBookingModal] = useState<VendorProfile | null>(null);

  const dismissWipNotice = () => {
    sessionStorage.setItem('vendors_wip_dismissed', 'true');
    setShowWipNotice(false);
  };

  const isStaff = user?.accountType && ['owner', 'admin', 'manager'].includes(user.accountType);

  const loadVendors = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (search) params.search = search;

      const response = await vendorsApi.search(params);
      setVendors(response.vendors || response.data || []);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const response = await vendorsApi.getBarnConnections();
      setConnections(response || []);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await vendorsApi.getAppointments({});
      setAppointments(response.appointments || response || []);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'directory') {
      loadVendors();
    } else if (activeTab === 'connections') {
      loadConnections();
    } else if (activeTab === 'appointments') {
      loadAppointments();
    }
  }, [activeTab, typeFilter]);

  useEffect(() => {
    if (activeTab === 'directory') {
      const debounce = setTimeout(() => {
        loadVendors();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [search]);

  const handleConnectVendor = async (vendorId: string) => {
    try {
      await vendorsApi.connectToBarn(vendorId);
      alert('Connection request sent!');
      loadVendors();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to connect');
    }
  };

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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      requested: 'warning',
      confirmed: 'info',
      inProgress: 'info',
      completed: 'success',
      cancelled: 'neutral',
      noShow: 'error',
      pendingVendor: 'warning',
      pendingBarn: 'warning',
      active: 'success',
      inactive: 'neutral',
      suspended: 'error',
    };
    return styles[status] || 'neutral';
  };

  return (
    <div className="page vendors-page">
      {/* Work in Progress Notice */}
      {showWipNotice && (
        <div className="modal-overlay" onClick={dismissWipNotice}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Coming Soon</h2>
              <button className="btn btn-ghost modal-close" onClick={dismissWipNotice}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem' }}>
                The <strong>Vendors</strong> feature is currently a work in progress.
              </p>
              <p style={{ marginBottom: '1rem' }}>
                When completed, this section will allow you to:
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li>Browse and search for veterinarians, farriers, and other service providers</li>
                <li>Connect with vendors and manage your preferred provider list</li>
                <li>Schedule and track appointments for your horses</li>
                <li>View appointment history and upcoming visits</li>
              </ul>
              <p className="text-secondary">
                Thank you for your patience as we build out this feature!
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={dismissWipNotice}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">Find and manage service providers</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="page-filters">
        <FilterTabs
          options={[
            { value: 'directory', label: 'Vendor Directory' },
            { value: 'connections', label: 'My Vendors' },
            { value: 'appointments', label: 'Appointments' },
          ]}
          value={activeTab}
          onChange={(value) => setActiveTab(value as TabType)}
          label="View"
        />
      </div>

      {/* Directory Tab */}
      {activeTab === 'directory' && (
        <>
          <div className="page-filters" style={{ marginTop: '1rem' }}>
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
                          {formatPhoneNumber(vendor.businessPhone)}
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
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowVendorDetail(vendor)}
                    >
                      View Profile
                    </button>
                    {isStaff && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowBookingModal(vendor)}
                      >
                        Book Appointment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Connections Tab */}
      {activeTab === 'connections' && (
        <>
          {isLoading ? (
            <div className="page-loading">
              <div className="spinner spinner-lg"></div>
            </div>
          ) : connections.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <UserCheck size={64} strokeWidth={1.5} />
              </div>
              <h3>No vendor connections</h3>
              <p>Browse the vendor directory to connect with service providers</p>
            </div>
          ) : (
            <div className="table-container" style={{ marginTop: '1rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Type</th>
                    <th>Services</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map((conn) => (
                    <tr key={conn._id || conn.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="vendor-avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
                            {conn.vendorId?.businessName?.charAt(0) || 'V'}
                          </div>
                          <span className="font-medium">{conn.vendorId?.businessName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>{getTypeLabel(conn.vendorId?.primaryType)}</td>
                      <td>{conn.services?.join(', ') || '-'}</td>
                      <td>
                        <span className={`badge badge-${getStatusBadge(conn.status)}`}>
                          {conn.status}
                        </span>
                      </td>
                      <td>
                        {conn.status === 'active' && isStaff && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => conn.vendorId && setShowBookingModal(conn.vendorId)}
                          >
                            Book
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <>
          {isLoading ? (
            <div className="page-loading">
              <div className="spinner spinner-lg"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Calendar size={64} strokeWidth={1.5} />
              </div>
              <h3>No appointments</h3>
              <p>Book an appointment from the vendor directory</p>
            </div>
          ) : (
            <div className="table-container" style={{ marginTop: '1rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Horse</th>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt.id}>
                      <td className="font-medium">{appt.vendor?.businessName || 'Unknown'}</td>
                      <td>{appt.horseName || '-'}</td>
                      <td>{format(new Date(appt.scheduledDate), 'MMM d, yyyy h:mm a')}</td>
                      <td>{appt.durationMinutes} min</td>
                      <td>{appt.type || '-'}</td>
                      <td>
                        <span className={`badge badge-${getStatusBadge(appt.status)}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td>
                        <AppointmentActions
                          appointment={appt}
                          onUpdate={loadAppointments}
                          isStaff={isStaff || false}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Vendor Detail Modal */}
      {showVendorDetail && (
        <VendorDetailModal
          vendor={showVendorDetail}
          onClose={() => setShowVendorDetail(null)}
          onConnect={() => {
            handleConnectVendor(showVendorDetail.id);
            setShowVendorDetail(null);
          }}
          onBook={() => {
            setShowBookingModal(showVendorDetail);
            setShowVendorDetail(null);
          }}
          isStaff={isStaff || false}
        />
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <BookAppointmentModal
          vendor={showBookingModal}
          onClose={() => setShowBookingModal(null)}
          onSuccess={() => {
            setShowBookingModal(null);
            setActiveTab('appointments');
            loadAppointments();
          }}
        />
      )}
    </div>
  );
}

function VendorDetailModal({
  vendor,
  onClose,
  onConnect,
  onBook,
  isStaff,
}: {
  vendor: VendorProfile;
  onClose: () => void;
  onConnect: () => void;
  onBook: () => void;
  isStaff: boolean;
}) {
  const vendorTypes: Record<string, string> = {
    vet: 'Veterinarian',
    farrier: 'Farrier',
    dentist: 'Equine Dentist',
    bodyworker: 'Bodyworker',
    trainer: 'Trainer',
    supplier: 'Supplier',
    transport: 'Transport',
    photographer: 'Photographer',
    other: 'Other',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{vendor.businessName}</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="vendor-detail-grid">
            <div className="vendor-detail-section">
              <h4>Business Information</h4>
              <div className="detail-item">
                <label>Type:</label>
                <span>{vendorTypes[vendor.primaryType] || vendor.primaryType}</span>
              </div>
              {vendor.additionalTypes && vendor.additionalTypes.length > 0 && (
                <div className="detail-item">
                  <label>Additional Services:</label>
                  <span>{vendor.additionalTypes.map(t => vendorTypes[t] || t).join(', ')}</span>
                </div>
              )}
              {vendor.description && (
                <div className="detail-item">
                  <label>Description:</label>
                  <span>{vendor.description}</span>
                </div>
              )}
            </div>

            <div className="vendor-detail-section">
              <h4>Contact</h4>
              {vendor.businessEmail && (
                <div className="detail-item">
                  <label>Email:</label>
                  <span>{vendor.businessEmail}</span>
                </div>
              )}
              {vendor.businessPhone && (
                <div className="detail-item">
                  <label>Phone:</label>
                  <span>{formatPhoneNumber(vendor.businessPhone)}</span>
                </div>
              )}
              {(vendor.city || vendor.state) && (
                <div className="detail-item">
                  <label>Location:</label>
                  <span>{[vendor.city, vendor.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>

            <div className="vendor-detail-section">
              <h4>Rating & Availability</h4>
              <div className="detail-item">
                <label>Rating:</label>
                <span className="flex items-center gap-1">
                  <Star size={16} fill="var(--warning)" stroke="var(--warning)" />
                  {vendor.rating.toFixed(1)} ({vendor.reviewCount} reviews)
                </span>
              </div>
              <div className="detail-item">
                <label>Accepting Clients:</label>
                <span>{vendor.acceptingNewClients ? 'Yes' : 'No'}</span>
              </div>
              <div className="detail-item">
                <label>Emergency Available:</label>
                <span>{vendor.emergencyAvailable ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          {isStaff && (
            <>
              <button className="btn btn-outline" onClick={onConnect}>
                Connect to Barn
              </button>
              <button className="btn btn-primary" onClick={onBook}>
                Book Appointment
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BookAppointmentModal({
  vendor,
  onClose,
  onSuccess,
}: {
  vendor: VendorProfile;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [horseId, setHorseId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [type, setType] = useState<string>(vendor.primaryType);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHorses, setIsLoadingHorses] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHorses = async () => {
      try {
        const response = await horsesApi.getAll({ limit: 100 });
        setHorses(response.data || []);
      } catch (err) {
        console.error('Failed to load horses:', err);
      } finally {
        setIsLoadingHorses(false);
      }
    };
    loadHorses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!scheduledDate) {
      setError('Please select a date');
      return;
    }

    setIsLoading(true);

    try {
      const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);

      await vendorsApi.createAppointment({
        vendorId: vendor.id,
        horseId: horseId || undefined,
        scheduledDate: dateTime.toISOString(),
        durationMinutes: parseInt(durationMinutes),
        type,
        price: price ? parseFloat(price) : undefined,
        notes: notes || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to book appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const appointmentTypes = [
    { value: 'vet', label: 'Veterinary Visit' },
    { value: 'farrier', label: 'Farrier Service' },
    { value: 'dentist', label: 'Dental Work' },
    { value: 'bodyworker', label: 'Bodywork Session' },
    { value: 'trainer', label: 'Training Session' },
    { value: 'transport', label: 'Transport' },
    { value: 'photographer', label: 'Photography' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Book Appointment</h2>
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
              <label className="form-label">Vendor</label>
              <input
                type="text"
                className="form-input"
                value={vendor.businessName}
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label">Horse (Optional)</label>
              <select
                className="form-select"
                value={horseId}
                onChange={(e) => setHorseId(e.target.value)}
                disabled={isLoadingHorses}
              >
                <option value="">No specific horse</option>
                {horses.map((horse) => (
                  <option key={horse.id} value={horse.id}>
                    {horse.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Time *</label>
                <input
                  type="time"
                  className="form-input"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <select
                  className="form-select"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Service Type</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {appointmentTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Price (Optional)</label>
              <input
                type="number"
                className="form-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special instructions or details..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AppointmentActions({
  appointment,
  onUpdate,
  isStaff,
}: {
  appointment: VendorAppointment;
  onUpdate: () => void;
  isStaff: boolean;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (status: string) => {
    setIsUpdating(true);
    try {
      await vendorsApi.updateAppointment(appointment.id, { status });
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isStaff) return null;

  return (
    <div className="flex gap-1">
      {appointment.status === 'requested' && (
        <>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => handleStatusUpdate('confirmed')}
            disabled={isUpdating}
            title="Confirm"
          >
            <CheckCircle size={16} className="text-success" />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => handleStatusUpdate('cancelled')}
            disabled={isUpdating}
            title="Cancel"
          >
            <XCircle size={16} className="text-error" />
          </button>
        </>
      )}
      {appointment.status === 'confirmed' && (
        <>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => handleStatusUpdate('inProgress')}
            disabled={isUpdating}
            title="Start"
          >
            <Clock size={16} className="text-info" />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => handleStatusUpdate('cancelled')}
            disabled={isUpdating}
            title="Cancel"
          >
            <XCircle size={16} className="text-error" />
          </button>
        </>
      )}
      {appointment.status === 'inProgress' && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => handleStatusUpdate('completed')}
          disabled={isUpdating}
          title="Complete"
        >
          <CheckCircle size={16} className="text-success" />
        </button>
      )}
    </div>
  );
}
