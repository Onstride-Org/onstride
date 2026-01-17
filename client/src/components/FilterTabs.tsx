interface FilterOption {
  value: string;
  label: string;
}

interface FilterTabsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function FilterTabs({ options, value, onChange, label = 'Filter' }: FilterTabsProps) {

  return (
    <>
      {/* Mobile: Dropdown */}
      <div className="filter-select-mobile">
        <select
          className="form-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: Tabs */}
      <div className="filter-tabs-desktop">
        {options.map((option) => (
          <button
            key={option.value}
            className={`filter-tab ${value === option.value ? 'active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}
