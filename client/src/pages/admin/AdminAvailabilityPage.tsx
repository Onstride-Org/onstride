import { useState, useEffect } from 'react';
import { Check, X, Plus } from 'lucide-react';

interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

interface DayAvailability {
  _id?: string;
  dayOfWeek: number;
  isEnabled: boolean;
  timeSlots: TimeSlot[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminAvailabilityPage() {
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSlot, setNewSlot] = useState('');
  const [addingToDay, setAddingToDay] = useState<number | null>(null);

  useEffect(() => {
    loadAvailability();
  }, []);

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json'
  });

  const loadAvailability = async () => {
    try {
      setIsLoading(true);
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/admin/availability`, { headers: getHeaders() });
      const data = await res.json();
      setAvailability(data);
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAvailability = async () => {
    try {
      setIsSaving(true);
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await fetch(`${apiBase}/admin/availability`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ availability })
      });
    } catch (error) {
      console.error('Failed to save availability:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (dayOfWeek: number) => {
    setAvailability(prev => prev.map(day =>
      day.dayOfWeek === dayOfWeek ? { ...day, isEnabled: !day.isEnabled } : day
    ));
  };

  const toggleSlot = (dayOfWeek: number, slotIndex: number) => {
    setAvailability(prev => prev.map(day => {
      if (day.dayOfWeek === dayOfWeek) {
        const newSlots = [...day.timeSlots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], isAvailable: !newSlots[slotIndex].isAvailable };
        return { ...day, timeSlots: newSlots };
      }
      return day;
    }));
  };

  const addTimeSlot = (dayOfWeek: number) => {
    if (!newSlot.trim()) return;

    setAvailability(prev => prev.map(day => {
      if (day.dayOfWeek === dayOfWeek) {
        const existingSlot = day.timeSlots.find(s => s.time.toLowerCase() === newSlot.toLowerCase());
        if (existingSlot) return day;

        return {
          ...day,
          timeSlots: [...day.timeSlots, { time: newSlot, isAvailable: true }].sort((a, b) => {
            const timeA = new Date(`1970-01-01 ${a.time}`).getTime();
            const timeB = new Date(`1970-01-01 ${b.time}`).getTime();
            return timeA - timeB;
          })
        };
      }
      return day;
    }));

    setNewSlot('');
    setAddingToDay(null);
  };

  const removeTimeSlot = (dayOfWeek: number, slotIndex: number) => {
    setAvailability(prev => prev.map(day => {
      if (day.dayOfWeek === dayOfWeek) {
        const newSlots = day.timeSlots.filter((_, i) => i !== slotIndex);
        return { ...day, timeSlots: newSlots };
      }
      return day;
    }));
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px 24px', color: '#525252', fontSize: '12px' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>
            Demo Availability
          </h1>
          <p style={{ color: '#525252', fontSize: '11px', marginTop: '4px' }}>
            Configure available days and times for demo bookings
          </p>
        </div>
        <button
          onClick={saveAvailability}
          disabled={isSaving}
          style={{
            padding: '6px 12px',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: isSaving ? 0.7 : 1
          }}
        >
          <Check size={12} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div style={{
        background: '#141414',
        border: '1px solid #1f1f1f',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', width: '100px' }}>Day</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', width: '80px' }}>Enabled</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Time Slots</th>
            </tr>
          </thead>
          <tbody>
            {availability.map(day => (
              <tr key={day.dayOfWeek} style={{ borderBottom: '1px solid #1f1f1f' }}>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ color: day.isEnabled ? 'white' : '#525252', fontSize: '12px', fontWeight: 500 }}>
                    {DAYS[day.dayOfWeek]}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => toggleDay(day.dayOfWeek)}
                    style={{
                      width: '32px',
                      height: '18px',
                      borderRadius: '9px',
                      border: 'none',
                      background: day.isEnabled ? '#22c55e' : '#333',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.15s'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      left: day.isEnabled ? '16px' : '2px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: 'white',
                      transition: 'left 0.15s'
                    }} />
                  </button>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    {day.timeSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          background: slot.isAvailable ? '#22c55e20' : '#33333380',
                          border: `1px solid ${slot.isAvailable ? '#22c55e40' : '#333'}`,
                          borderRadius: '4px',
                          opacity: day.isEnabled ? 1 : 0.5
                        }}
                      >
                        <button
                          onClick={() => toggleSlot(day.dayOfWeek, idx)}
                          disabled={!day.isEnabled}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: day.isEnabled ? 'pointer' : 'default',
                            color: slot.isAvailable ? '#22c55e' : '#525252',
                            fontSize: '11px'
                          }}
                        >
                          {slot.time}
                        </button>
                        <button
                          onClick={() => removeTimeSlot(day.dayOfWeek, idx)}
                          disabled={!day.isEnabled}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            cursor: day.isEnabled ? 'pointer' : 'default',
                            color: '#525252',
                            display: 'flex'
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {addingToDay === day.dayOfWeek ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="text"
                          value={newSlot}
                          onChange={(e) => setNewSlot(e.target.value)}
                          placeholder="e.g., 5:00 PM"
                          onKeyDown={(e) => e.key === 'Enter' && addTimeSlot(day.dayOfWeek)}
                          style={{
                            padding: '4px 8px',
                            background: '#0a0a0a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '11px',
                            width: '80px',
                            outline: 'none'
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => addTimeSlot(day.dayOfWeek)}
                          style={{
                            background: '#22c55e',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px',
                            cursor: 'pointer',
                            display: 'flex'
                          }}
                        >
                          <Check size={12} color="white" />
                        </button>
                        <button
                          onClick={() => { setAddingToDay(null); setNewSlot(''); }}
                          style={{
                            background: '#333',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px',
                            cursor: 'pointer',
                            display: 'flex'
                          }}
                        >
                          <X size={12} color="#a3a3a3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingToDay(day.dayOfWeek)}
                        disabled={!day.isEnabled}
                        style={{
                          background: 'none',
                          border: '1px dashed #333',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: day.isEnabled ? 'pointer' : 'default',
                          color: '#525252',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: day.isEnabled ? 1 : 0.5
                        }}
                      >
                        <Plus size={10} />
                        Add
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '16px', padding: '12px', background: '#141414', border: '1px solid #1f1f1f', borderRadius: '6px' }}>
        <div style={{ color: '#525252', fontSize: '11px' }}>
          <strong style={{ color: '#737373' }}>Note:</strong> Changes will be reflected immediately in the demo booking form on the landing page.
          Green slots are available for booking, gray slots are disabled.
        </div>
      </div>
    </div>
  );
}
