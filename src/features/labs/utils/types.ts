/**
 * Shared types for the labs feature UI layer.
 * Kept separate from API contracts so they can evolve independently.
 */
import type { LabResult } from '../api/index';

export interface TimelineAction {
  label: string;
  url: string;
}

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  occurredAt: string | null;
  sortTimestamp: number;
  sortOrder: number;
  actions: TimelineAction[];
}

export interface GroupedLabPanel {
  orderId: string;
  name: string;
  lab: string;
  collectedDate: string;
  reportedDate: string;
  biomarkers: LabResult[];
  status: string;
  standaloneOrderId?: string;
}
