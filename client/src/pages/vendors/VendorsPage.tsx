/// <reference types="google.maps" />
import { useState, useEffect, useRef, useCallback } from 'react';
import { vendorsApi } from '../../services/api';
import { VendorAppointment } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { format } from 'date-fns';
import {
  Search, MapPin, Phone, Star, X, Calendar, Clock,
  CheckCircle, XCircle, Navigation, Bookmark, BookmarkCheck, ExternalLink,
  Globe, List, Map as MapIcon, Loader2
} from 'lucide-react';
import FilterTabs from '../../components/FilterTabs';

const GOOGLE_API_KEY = 'AIzaSyBnb_xqz6XEYPtPd9CENY75fmWD4BdcoRE';

type TabType = 'find' | 'saved' | 'appointments';

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  photos?: google.maps.places.PlacePhoto[];
  types?: string[];
  business_status?: string;
}

interface SavedVendor {
  id: string;
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  serviceType: string;
  savedAt: string;
  notes?: string;
  lat: number;
  lng: number;
}

const SERVICE_TYPES = [
  { value: 'equine_veterinarian', label: 'Veterinarian', query: 'equine veterinarian' },
  { value: 'farrier', label: 'Farrier', query: 'farrier horse' },
  { value: 'equine_dentist', label: 'Equine Dentist', query: 'equine dentist' },
  { value: 'horse_trainer', label: 'Trainer', query: 'horse trainer' },
  { value: 'equine_massage', label: 'Bodyworker', query: 'equine massage therapist' },
  { value: 'horse_transport', label: 'Transport', query: 'horse transport hauling' },
  { value: 'equine_photographer', label: 'Photographer', query: 'equine photographer horse' },
  { value: 'tack_shop', label: 'Tack Shop', query: 'tack shop horse supplies' },
  { value: 'feed_store', label: 'Feed Store', query: 'horse feed store' },
];

export default function VendorsPage() {
  const { user, currentBarnId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('find');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState(SERVICE_TYPES[0]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  // Places results
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);

  // Saved vendors
  const [savedVendors, setSavedVendors] = useState<SavedVendor[]>([]);

  // Appointments (existing functionality)
  const [appointments, setAppointments] = useState<VendorAppointment[]>([]);

  // Google Maps refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const isStaff = user?.accountType && ['owner', 'admin', 'manager'].includes(user.accountType);

  // Load saved vendors from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`savedVendors_${currentBarnId}`);
    if (saved) {
      setSavedVendors(JSON.parse(saved));
    }
  }, [currentBarnId]);

  // Save vendors to localStorage when updated
  const saveSavedVendors = (vendors: SavedVendor[]) => {
    setSavedVendors(vendors);
    localStorage.setItem(`savedVendors_${currentBarnId}`, JSON.stringify(vendors));
  };

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps loaded');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize map when view mode changes to map
  useEffect(() => {
    if (viewMode === 'map' && mapRef.current && window.google?.maps && userLocation) {
      initializeMap();
    }
  }, [viewMode, userLocation]);

  // Initialize Google Places Autocomplete for address input
  useEffect(() => {
    if (!window.google?.maps?.places || !addressInputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
      types: ['geocode', 'establishment'],
      fields: ['geometry', 'formatted_address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setManualAddress(place.formatted_address || '');
        setUserLocation(location);
        searchPlaces(location);
      }
    });

    autocompleteRef.current = autocomplete;
  }, [selectedServiceType]);

  // Re-check for Google Maps loaded (for autocomplete init)
  useEffect(() => {
    const checkGoogleMaps = setInterval(() => {
      if (window.google?.maps?.places && addressInputRef.current && !autocompleteRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
          types: ['geocode', 'establishment'],
          fields: ['geometry', 'formatted_address'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry?.location) {
            const location = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };
            setManualAddress(place.formatted_address || '');
            setUserLocation(location);
            searchPlaces(location);
          }
        });

        autocompleteRef.current = autocomplete;
        clearInterval(checkGoogleMaps);
      }
    }, 500);

    return () => clearInterval(checkGoogleMaps);
  }, []);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps || !userLocation) return;

    const map = new google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 12,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;
    placesServiceRef.current = new google.maps.places.PlacesService(map);

    // Add user location marker
    new google.maps.Marker({
      position: userLocation,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      title: 'Your Location',
    });

    // Search for places if we have results
    if (places.length > 0) {
      addPlaceMarkers(map, places);
    }
  }, [userLocation, places]);

  const addPlaceMarkers = (map: google.maps.Map, placeResults: PlaceResult[]) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    if (userLocation) {
      bounds.extend(userLocation);
    }

    placeResults.forEach((place, index) => {
      const position = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      const marker = new google.maps.Marker({
        position,
        map,
        title: place.name,
        label: {
          text: String(index + 1),
          color: '#fff',
          fontWeight: 'bold',
        },
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
          fillColor: isSaved(place.place_id) ? '#22C55E' : '#171717',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 1,
          scale: 1.5,
          anchor: new google.maps.Point(12, 24),
          labelOrigin: new google.maps.Point(12, 10),
        },
      });

      marker.addListener('click', () => {
        setSelectedPlace(place);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (placeResults.length > 0) {
      map.fitBounds(bounds, 50);
    }
  };

  const getLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setIsGettingLocation(false);
        // Auto-search after getting location
        searchPlaces(location);
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const searchPlaces = async (location: { lat: number; lng: number }) => {
    if (!window.google?.maps) {
      console.error('Google Maps not loaded');
      return;
    }

    setIsLoading(true);
    setPlaces([]);

    // Create a temporary div for PlacesService if map isn't initialized
    let service: google.maps.places.PlacesService;
    if (placesServiceRef.current) {
      service = placesServiceRef.current;
    } else {
      const tempDiv = document.createElement('div');
      service = new google.maps.places.PlacesService(tempDiv);
    }

    const request: google.maps.places.TextSearchRequest = {
      query: selectedServiceType.query,
      location: new google.maps.LatLng(location.lat, location.lng),
      radius: 50000, // 50km radius
    };

    service.textSearch(request, (results, status) => {
      setIsLoading(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // Get detailed info for each place
        const detailedPlaces: PlaceResult[] = [];
        let completed = 0;

        results.slice(0, 20).forEach((result) => {
          service.getDetails(
            {
              placeId: result.place_id!,
              fields: [
                'place_id', 'name', 'formatted_address', 'formatted_phone_number',
                'website', 'rating', 'user_ratings_total', 'opening_hours',
                'geometry', 'photos', 'types', 'business_status'
              ],
            },
            (place, detailStatus) => {
              completed++;
              if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place) {
                detailedPlaces.push(place as PlaceResult);
              }
              if (completed === Math.min(results.length, 20)) {
                // Sort by rating and then by number of reviews
                detailedPlaces.sort((a, b) => {
                  const ratingDiff = (b.rating || 0) - (a.rating || 0);
                  if (ratingDiff !== 0) return ratingDiff;
                  return (b.user_ratings_total || 0) - (a.user_ratings_total || 0);
                });
                setPlaces(detailedPlaces);

                // Update map markers if map is visible
                if (mapInstanceRef.current) {
                  addPlaceMarkers(mapInstanceRef.current, detailedPlaces);
                }
              }
            }
          );
        });

        if (results.length === 0) {
          setPlaces([]);
        }
      } else {
        console.error('Places search failed:', status);
      }
    });
  };

  const isSaved = (placeId: string) => {
    return savedVendors.some(v => v.placeId === placeId);
  };

  const toggleSaveVendor = (place: PlaceResult) => {
    if (isSaved(place.place_id)) {
      // Remove from saved
      const updated = savedVendors.filter(v => v.placeId !== place.place_id);
      saveSavedVendors(updated);
    } else {
      // Add to saved
      const newVendor: SavedVendor = {
        id: `${Date.now()}`,
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number,
        website: place.website,
        rating: place.rating,
        reviewCount: place.user_ratings_total,
        serviceType: selectedServiceType.value,
        savedAt: new Date().toISOString(),
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      saveSavedVendors([...savedVendors, newVendor]);
    }
  };

  const removeSavedVendor = (id: string) => {
    const updated = savedVendors.filter(v => v.id !== id);
    saveSavedVendors(updated);
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
    if (activeTab === 'appointments') {
      loadAppointments();
    }
  }, [activeTab]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      requested: 'warning',
      confirmed: 'info',
      inProgress: 'info',
      completed: 'success',
      cancelled: 'neutral',
      noShow: 'error',
    };
    return styles[status] || 'neutral';
  };

  return (
    <div className="page vendors-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Find Vendors</h1>
          <p className="page-subtitle">Discover equine service providers near you</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="page-filters">
        <FilterTabs
          options={[
            { value: 'find', label: 'Find Services' },
            { value: 'saved', label: `My Vendors (${savedVendors.length})` },
            { value: 'appointments', label: 'Appointments' },
          ]}
          value={activeTab}
          onChange={(value) => setActiveTab(value as TabType)}
          label="View"
        />
      </div>

      {/* Find Services Tab */}
      {activeTab === 'find' && (
        <div className="vendors-find-container">
          {/* Location & Service Selection */}
          <div className="vendors-search-bar">
            <div className="vendors-search-controls">
              {/* Service Type Dropdown */}
              <div className="service-type-select">
                <select
                  className="form-select"
                  value={selectedServiceType.value}
                  onChange={(e) => {
                    const type = SERVICE_TYPES.find(s => s.value === e.target.value);
                    if (type) {
                      setSelectedServiceType(type);
                      if (userLocation) {
                        searchPlaces(userLocation);
                      }
                    }
                  }}
                >
                  {SERVICE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Button */}
              <button
                className={`btn ${userLocation ? 'btn-outline' : 'btn-primary'}`}
                onClick={getLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Navigation size={18} />
                )}
                <span className="btn-text-desktop">
                  {isGettingLocation ? 'Getting Location...' : userLocation ? 'Update Location' : 'Share Location'}
                </span>
              </button>

              {/* Search Button */}
              {userLocation && (
                <button
                  className="btn btn-primary vendors-search-btn"
                  onClick={() => searchPlaces(userLocation)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Search size={18} />
                  )}
                  <span className="btn-text-desktop">
                    {isLoading ? 'Searching...' : 'Search'}
                  </span>
                </button>
              )}
            </div>

            {/* Manual Address Input with Autocomplete */}
            <div className="vendors-address-input">
              <div className="address-input-group">
                <MapPin size={18} className="address-input-icon" />
                <input
                  ref={addressInputRef}
                  type="text"
                  className="form-input"
                  placeholder="Or enter address..."
                  defaultValue={manualAddress}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>

            {/* View Mode Toggle */}
            {places.length > 0 && (
              <div className="view-mode-toggle">
                <button
                  className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={16} />
                  List
                </button>
                <button
                  className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setViewMode('map')}
                >
                  <MapIcon size={16} />
                  Map
                </button>
              </div>
            )}
          </div>

          {locationError && (
            <div className="alert alert-error">
              <span>{locationError}</span>
            </div>
          )}

          {/* No Location State */}
          {!userLocation && !isGettingLocation && (
            <div className="empty-state">
              <div className="empty-icon">
                <Navigation size={64} strokeWidth={1.5} />
              </div>
              <h3>Share Your Location</h3>
              <p>Allow location access to find {selectedServiceType.label.toLowerCase()}s near you</p>
              <button className="btn btn-primary btn-lg" onClick={getLocation}>
                <Navigation size={20} />
                Enable Location
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="page-loading">
              <div className="spinner spinner-lg"></div>
              <p>Searching for {selectedServiceType.label.toLowerCase()}s nearby...</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && userLocation && places.length > 0 && (
            <>
              <div className="vendors-results-header">
                <span className="results-count">{places.length} {selectedServiceType.label}s found nearby</span>
              </div>

              {viewMode === 'list' ? (
                <div className="vendor-grid">
                  {places.map((place, index) => (
                    <PlaceCard
                      key={place.place_id}
                      place={place}
                      index={index + 1}
                      isSaved={isSaved(place.place_id)}
                      onToggleSave={() => toggleSaveVendor(place)}
                      onSelect={() => setSelectedPlace(place)}
                    />
                  ))}
                </div>
              ) : (
                <div className="vendors-map-container">
                  <div ref={mapRef} className="vendors-map" />
                  {selectedPlace && (
                    <div className="map-place-detail">
                      <PlaceCard
                        place={selectedPlace}
                        index={places.findIndex(p => p.place_id === selectedPlace.place_id) + 1}
                        isSaved={isSaved(selectedPlace.place_id)}
                        onToggleSave={() => toggleSaveVendor(selectedPlace)}
                        onSelect={() => {}}
                        expanded
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedPlace(null)}
                      >
                        <X size={16} /> Close
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* No Results */}
          {!isLoading && userLocation && places.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <Search size={64} strokeWidth={1.5} />
              </div>
              <h3>No Results Found</h3>
              <p>No {selectedServiceType.label.toLowerCase()}s found in your area. Try a different service type.</p>
            </div>
          )}
        </div>
      )}

      {/* Saved Vendors Tab */}
      {activeTab === 'saved' && (
        <>
          {savedVendors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Bookmark size={64} strokeWidth={1.5} />
              </div>
              <h3>No Saved Vendors</h3>
              <p>Save vendors from search results to build your contact list</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('find')}>
                Find Vendors
              </button>
            </div>
          ) : (
            <div className="saved-vendors-list">
              {SERVICE_TYPES.map((serviceType) => {
                const vendorsOfType = savedVendors.filter(v => v.serviceType === serviceType.value);
                if (vendorsOfType.length === 0) return null;

                return (
                  <div key={serviceType.value} className="saved-vendor-group">
                    <h3 className="saved-vendor-group-title">{serviceType.label}s</h3>
                    <div className="vendor-grid">
                      {vendorsOfType.map((vendor) => (
                        <SavedVendorCard
                          key={vendor.id}
                          vendor={vendor}
                          onRemove={() => removeSavedVendor(vendor.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
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
              <h3>No Appointments</h3>
              <p>Schedule appointments with your saved vendors</p>
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
    </div>
  );
}

// Place Card Component
function PlaceCard({
  place,
  index,
  isSaved,
  onToggleSave,
  onSelect,
  expanded = false,
}: {
  place: PlaceResult;
  index: number;
  isSaved: boolean;
  onToggleSave: () => void;
  onSelect: () => void;
  expanded?: boolean;
}) {
  const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 });

  return (
    <div className={`vendor-card ${expanded ? 'expanded' : ''}`} onClick={onSelect}>
      {photoUrl && (
        <div className="vendor-card-image">
          <img src={photoUrl} alt={place.name} />
          <span className="vendor-card-index">{index}</span>
        </div>
      )}
      {!photoUrl && (
        <div className="vendor-card-index-badge">{index}</div>
      )}

      <div className="vendor-card-header">
        <div className="vendor-header-info">
          <h3 className="vendor-name">{place.name}</h3>
          {place.rating && (
            <div className="vendor-rating">
              <Star size={14} fill="currentColor" />
              <span>{place.rating.toFixed(1)}</span>
              {place.user_ratings_total && (
                <span className="rating-count">({place.user_ratings_total})</span>
              )}
            </div>
          )}
        </div>
        <button
          className={`btn btn-icon btn-sm ${isSaved ? 'btn-primary' : 'btn-ghost'}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          title={isSaved ? 'Remove from saved' : 'Save vendor'}
        >
          {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>

      <div className="vendor-card-body">
        <div className="vendor-details">
          <div className="vendor-location">
            <MapPin size={14} />
            <span>{place.formatted_address}</span>
          </div>

          {place.formatted_phone_number && (
            <a
              href={`tel:${place.formatted_phone_number}`}
              className="vendor-phone"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone size={14} />
              <span>{place.formatted_phone_number}</span>
            </a>
          )}

          {place.website && (
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="vendor-website"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe size={14} />
              <span>Website</span>
              <ExternalLink size={12} />
            </a>
          )}

          {place.opening_hours && (
            <div className={`vendor-hours ${place.opening_hours.open_now ? 'open' : 'closed'}`}>
              <Clock size={14} />
              <span>{place.opening_hours.open_now ? 'Open Now' : 'Closed'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="vendor-card-actions">
        {place.formatted_phone_number && (
          <a
            href={`tel:${place.formatted_phone_number}`}
            className="btn btn-outline btn-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone size={16} />
            Call
          </a>
        )}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.formatted_address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <Navigation size={16} />
          Directions
        </a>
        <button
          className={`btn btn-sm ${isSaved ? 'btn-success' : 'btn-primary'}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
        >
          {isSaved ? (
            <>
              <BookmarkCheck size={16} />
              Saved
            </>
          ) : (
            <>
              <Bookmark size={16} />
              Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Saved Vendor Card Component
function SavedVendorCard({
  vendor,
  onRemove,
}: {
  vendor: SavedVendor;
  onRemove: () => void;
}) {
  return (
    <div className="vendor-card saved">
      <div className="vendor-card-header">
        <div className="vendor-header-info">
          <h3 className="vendor-name">{vendor.name}</h3>
          {vendor.rating && (
            <div className="vendor-rating">
              <Star size={14} fill="currentColor" />
              <span>{vendor.rating.toFixed(1)}</span>
              {vendor.reviewCount && (
                <span className="rating-count">({vendor.reviewCount})</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="vendor-card-body">
        <div className="vendor-details">
          <div className="vendor-location">
            <MapPin size={14} />
            <span>{vendor.address}</span>
          </div>

          {vendor.phone && (
            <a href={`tel:${vendor.phone}`} className="vendor-phone">
              <Phone size={14} />
              <span>{vendor.phone}</span>
            </a>
          )}

          {vendor.website && (
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="vendor-website"
            >
              <Globe size={14} />
              <span>Website</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        <div className="vendor-saved-meta">
          <span>Saved {format(new Date(vendor.savedAt), 'MMM d, yyyy')}</span>
        </div>
      </div>

      <div className="vendor-card-actions">
        <div className="saved-actions-row">
          {vendor.phone ? (
            <a href={`tel:${vendor.phone}`} className="btn btn-outline btn-sm">
              <Phone size={16} />
              Call
            </a>
          ) : (
            <span></span>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(vendor.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
          >
            <Navigation size={16} />
            Directions
          </a>
        </div>
        <button className="remove-link" onClick={onRemove}>
          <X size={14} />
          Remove from saved
        </button>
      </div>
    </div>
  );
}

// Appointment Actions Component
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
