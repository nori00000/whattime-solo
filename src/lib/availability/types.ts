export type TimeInterval = {
  start: Date;
  end: Date;
};

export type AvailabilityRuleInput = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

export type DateOverrideInput = {
  date: Date;
  isUnavailable: boolean;
  startMinute?: number | null;
  endMinute?: number | null;
};

export type Slot = TimeInterval;
