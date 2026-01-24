import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stablesApi, horsesApi } from '../../services/api';
import { Horse } from '../../types';
import { ArrowLeft, Settings } from 'lucide-react';

interface Stall {
  stallId: string;
  label: string;
  horse: Horse | null;
  row: number;
  column: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  notes?: string;
}

interface Stable {
  _id: string;
  name: string;
  layout: 'l-shape' | 'circular' | 'aisles';
  totalStalls: number;
  stallsPerRow: number;
  stalls: Stall[];
  occupiedCount: number;
  availableCount: number;
}

type SetupStep = 'shape' | 'stalls' | 'complete';
type LayoutType = 'l-shape' | 'circular' | 'aisles';

export default function StablePage() {
  const navigate = useNavigate();
  const [stable, setStable] = useState<Stable | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [horses, setHorses] = useState<Horse[]>([]);

  // Setup wizard state
  const [setupStep, setSetupStep] = useState<SetupStep>('shape');
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('aisles');
  const [stallCount, setStallCount] = useState(12);

  // Assign modal state
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    loadStable();
    loadHorses();
  }, []);

  const loadStable = async () => {
    try {
      const response = await stablesApi.get();
      setStable(response.stable);
      setIsConfigured(response.isConfigured);
    } catch (error) {
      console.error('Failed to load stable:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHorses = async () => {
    try {
      const response = await horsesApi.getAll({ limit: 100 });
      setHorses(response.data || []);
    } catch (error) {
      console.error('Failed to load horses:', error);
    }
  };

  const handleConfigureStable = async () => {
    try {
      const response = await stablesApi.configure({
        layout: selectedLayout,
        totalStalls: stallCount,
        stallsPerRow: 4,
      });
      setStable(response.stable);
      setIsConfigured(true);
      setSetupStep('complete');
    } catch (error) {
      console.error('Failed to configure stable:', error);
    }
  };

  const handleAssignHorse = async (horseId: string | null) => {
    if (!selectedStall) return;

    try {
      const response = await stablesApi.assignHorse(selectedStall.stallId, horseId);
      setStable(response.stable);
      setShowAssignModal(false);
      setSelectedStall(null);
    } catch (error) {
      console.error('Failed to assign horse:', error);
    }
  };

  const handleStallClick = (stall: Stall) => {
    setSelectedStall(stall);
    setShowAssignModal(true);
  };

  const handleReconfigure = () => {
    setIsConfigured(false);
    setSetupStep('shape');
  };

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  // Setup Wizard
  if (!isConfigured) {
    return (
      <div className="page stable-page">
        <div className="stable-setup">
          {setupStep === 'shape' && (
            <>
              <div className="stable-setup-header">
                <button className="btn btn-icon btn-ghost" onClick={() => navigate(-1)}>
                  <ArrowLeft size={24} />
                </button>
                <h1 className="stable-setup-title">Stable management</h1>
                <div style={{ width: 44 }}></div>
              </div>
              <div className="stable-setup-section">
                <h2>Select barn shape</h2>
                <p className="text-secondary">Let's start by setting up your stable's layout!</p>
              </div>

              <div className="stable-layout-options">
                <button
                  className={`stable-layout-option ${selectedLayout === 'l-shape' ? 'selected' : ''}`}
                  onClick={() => setSelectedLayout('l-shape')}
                >
                  <span className="layout-option-title">L-Shape</span>
                  <span className="layout-option-desc">Stalls arranged in a L-shaped configuration</span>
                </button>

                <button
                  className={`stable-layout-option ${selectedLayout === 'circular' ? 'selected' : ''}`}
                  onClick={() => setSelectedLayout('circular')}
                >
                  <span className="layout-option-title">Circular</span>
                  <span className="layout-option-desc">Stalls arranged in a circular pattern</span>
                </button>

                <button
                  className={`stable-layout-option ${selectedLayout === 'aisles' ? 'selected' : ''}`}
                  onClick={() => setSelectedLayout('aisles')}
                >
                  <span className="layout-option-title">With Aisles</span>
                  <span className="layout-option-desc">Stalls arranged in rows with aisles between</span>
                </button>
              </div>

              <button className="btn btn-primary btn-block" onClick={() => setSetupStep('stalls')}>
                Continue
              </button>
            </>
          )}

          {setupStep === 'stalls' && (
            <>
              <div className="stable-setup-header">
                <button className="btn btn-icon btn-ghost" onClick={() => setSetupStep('shape')}>
                  <ArrowLeft size={24} />
                </button>
                <h1 className="stable-setup-title">Stable</h1>
                <div style={{ width: 44 }}></div>
              </div>
              <div className="stable-setup-section">
                <h2>Number of stalls</h2>
                <p className="text-secondary">
                  How many stalls do you need?
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Number of stalls</label>
                <input
                  type="number"
                  className="form-input"
                  value={stallCount}
                  onChange={(e) => setStallCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="100"
                  placeholder="Enter number of stalls"
                />
              </div>

              <button className="btn btn-primary btn-block" onClick={handleConfigureStable}>
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main Stable View
  return (
    <div className="page stable-page">
      <div className="stable-header">
        <button className="btn btn-icon btn-ghost" onClick={handleReconfigure}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="stable-title">Stable</h1>
        <button className="btn btn-icon btn-ghost" onClick={handleReconfigure}>
          <Settings size={24} />
        </button>
      </div>

      <div className="stable-stats">
        <span className="stable-stat">
          <strong>{stable?.occupiedCount || 0}</strong> occupied
        </span>
        <span className="stable-stat">
          <strong>{stable?.availableCount || 0}</strong> available
        </span>
      </div>

      {stable && (
        <div className="stable-layout-container">
          {stable.layout === 'aisles' && <AislesLayout stalls={stable.stalls} stallsPerRow={stable.stallsPerRow} onStallClick={handleStallClick} />}
          {stable.layout === 'l-shape' && <LShapeLayout stalls={stable.stalls} onStallClick={handleStallClick} />}
          {stable.layout === 'circular' && <CircularLayout stalls={stable.stalls} onStallClick={handleStallClick} />}
        </div>
      )}

      {showAssignModal && selectedStall && (
        <AssignHorseModal
          stall={selectedStall}
          horses={horses}
          assignedHorseIds={stable?.stalls.filter(s => s.horse).map(s => s.horse!._id || (s.horse as any).id) || []}
          onAssign={handleAssignHorse}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedStall(null);
          }}
        />
      )}
    </div>
  );
}

// ============ Layout Components ============

interface LayoutProps {
  stalls: Stall[];
  stallsPerRow?: number;
  onStallClick: (stall: Stall) => void;
}

function AislesLayout({ stalls, onStallClick }: LayoutProps) {
  // Group stalls by row
  const rows: { [key: number]: Stall[] } = {};
  stalls.forEach((stall) => {
    if (!rows[stall.row]) rows[stall.row] = [];
    rows[stall.row].push(stall);
  });

  const sortedRows = Object.keys(rows)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="stable-aisles-layout">
      {sortedRows.map((rowNum, idx) => (
        <div key={rowNum}>
          <div className="stable-stall-row">
            {rows[rowNum]
              .sort((a, b) => a.column - b.column)
              .map((stall) => (
                <StallCard key={stall.stallId} stall={stall} onClick={() => onStallClick(stall)} />
              ))}
          </div>
          {idx < sortedRows.length - 1 && <div className="stable-aisle">Aisles</div>}
        </div>
      ))}
    </div>
  );
}

function LShapeLayout({ stalls, onStallClick }: LayoutProps) {
  // Separate vertical and horizontal stalls
  const verticalStalls = stalls.filter((s) => s.column === 0);
  const horizontalStalls = stalls.filter((s) => s.column > 0);

  return (
    <div className="stable-lshape-layout">
      <div className="lshape-vertical">
        {verticalStalls
          .sort((a, b) => a.row - b.row)
          .map((stall) => (
            <StallCard key={stall.stallId} stall={stall} onClick={() => onStallClick(stall)} />
          ))}
      </div>
      {horizontalStalls.length > 0 && (
        <div className="lshape-horizontal">
          {horizontalStalls
            .sort((a, b) => a.column - b.column)
            .map((stall) => (
              <StallCard key={stall.stallId} stall={stall} onClick={() => onStallClick(stall)} />
            ))}
        </div>
      )}
    </div>
  );
}

function CircularLayout({ stalls, onStallClick }: LayoutProps) {
  const totalStalls = stalls.length;
  const radius = Math.max(150, totalStalls * 12); // Dynamic radius based on stall count

  return (
    <div className="stable-circular-layout">
      <div className="circular-ring" style={{ width: radius * 2 + 80, height: radius * 2 + 80 }}>
        {stalls.map((stall, index) => {
          const angle = (index / totalStalls) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const rotation = (angle * 180) / Math.PI + 90;

          return (
            <div
              key={stall.stallId}
              className="circular-stall-wrapper"
              style={{
                transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
              }}
            >
              <StallCard stall={stall} onClick={() => onStallClick(stall)} mini />
            </div>
          );
        })}
        <div className="circular-center">Center area</div>
      </div>
    </div>
  );
}

// ============ Stall Card Component ============

interface StallCardProps {
  stall: Stall;
  onClick: () => void;
  mini?: boolean;
}

function StallCard({ stall, onClick, mini = false }: StallCardProps) {
  const hasHorse = !!stall.horse;

  return (
    <button
      className={`stable-stall ${hasHorse ? 'occupied' : 'available'} ${mini ? 'mini' : ''}`}
      onClick={onClick}
    >
      <span className="stall-label">{stall.label}</span>
      {hasHorse && !mini && (
        <span className="stall-horse-name">{stall.horse?.name}</span>
      )}
    </button>
  );
}

// ============ Assign Horse Modal ============

interface AssignHorseModalProps {
  stall: Stall;
  horses: Horse[];
  assignedHorseIds: string[];
  onAssign: (horseId: string | null) => void;
  onClose: () => void;
}

function AssignHorseModal({ stall, horses, assignedHorseIds, onAssign, onClose }: AssignHorseModalProps) {
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);

  // Filter horses - show unassigned horses only
  const availableHorses = horses.filter((horse) => {
    const horseId = horse._id || horse.id;
    const isAssigned = assignedHorseIds.includes(horseId);
    return !isAssigned;
  });

  const currentHorseId = stall.horse?._id || (stall.horse as any)?.id;

  const handleSave = () => {
    if (selectedHorseId) {
      onAssign(selectedHorseId);
    }
  };

  const handleRemove = () => {
    onAssign(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal stable-assign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign Horse to Stall {stall.label}</h2>
        </div>

        <p className="text-secondary modal-subtitle">
          Select a horse from the available list to assign to this stall.
        </p>

        <div className="horse-list">
          {stall.horse && (
            <div className="horse-list-item current">
              <div className="horse-list-info">
                <span className="horse-list-name">{stall.horse.name}</span>
                <span className="horse-list-details">
                  {typeof stall.horse.breed === 'object' ? stall.horse.breed?.label : stall.horse.breed} &middot; {stall.horse.age || '?'} years &middot; Currently assigned
                </span>
              </div>
              <button type="button" className="btn btn-sm btn-danger" onClick={handleRemove}>
                Remove
              </button>
            </div>
          )}

          {availableHorses.map((horse) => {
            const horseId = String(horse._id || horse.id);
            const isSelected = selectedHorseId === horseId;

            return (
              <button
                key={horseId}
                type="button"
                className={`horse-list-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedHorseId(isSelected ? null : horseId)}
              >
                <div className="horse-list-info">
                  <span className="horse-list-name">
                    {horse.name} <span className="text-tertiary">{horse.gender || horse.sexStatus?.label}</span>
                  </span>
                  <span className="horse-list-details">
                    {typeof horse.breed === 'object' ? horse.breed?.label : horse.breed} &middot; {horse.age || '?'} years
                    {horse.owner && <> &middot; <span className="owner-icon">&#128100;</span> {horse.owner.name}</>}
                  </span>
                </div>
                {isSelected && (
                  <span className="horse-list-check">&#10003;</span>
                )}
              </button>
            );
          })}

          {availableHorses.length === 0 && !stall.horse && (
            <div className="empty-state-small">
              <p>No available horses to assign</p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!selectedHorseId}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
