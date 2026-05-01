import type { PCPERatio, PCPEExportFormat } from '../types/types';

// V1.7 Update: All background and visual direction presets are now obsolete.
// The AI Diagnosis and Background Card Engine dynamically generate all options.
// These static constants are no longer used and have been removed to align with the new architecture.

export const RATIOS_PCPE: PCPERatio[] = ["1:1", "3:4", "9:16"];
export const EXPORT_FORMATS_PCPE: PCPEExportFormat[] = ["PNG", "JPG", "PDF"];