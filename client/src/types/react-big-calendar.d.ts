declare module 'react-big-calendar' {
  import { ComponentType, CSSProperties, SyntheticEvent } from 'react';

  export interface View {}

  export const Views: {
    MONTH: View;
    WEEK: View;
    WORK_WEEK: View;
    DAY: View;
    AGENDA: View;
  };

  export interface CalendarProps {
    localizer: any;
    events?: any[];
    startAccessor?: string | ((event: any) => Date);
    endAccessor?: string | ((event: any) => Date);
    style?: CSSProperties;
    date?: Date;
    view?: View;
    onNavigate?: (date: Date, view?: View, action?: string) => void;
    onView?: (view: View) => void;
    onSelectEvent?: (event: any, e?: SyntheticEvent) => void;
    onSelectSlot?: (slotInfo: any) => void;
    selectable?: boolean | 'ignoreEvents';
    popup?: boolean;
    components?: any;
    eventPropGetter?: (event: any, start?: Date, end?: Date, isSelected?: boolean) => { className?: string; style?: CSSProperties };
    [key: string]: any;
  }

  export const Calendar: ComponentType<CalendarProps>;

  export function dateFnsLocalizer(config: {
    format: any;
    parse: any;
    startOfWeek: any;
    getDay: any;
    locales: Record<string, any>;
  }): any;

  export default Calendar;
}
