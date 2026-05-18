import type { ActivationRequestPayload } from '@/components/prefab/activation-intake-schema';
import type { ActivationScoringResult } from '@/lib/activation-scoring';

export const ACTIVATION_MANDATE_DRAFT_STORAGE_KEY = 'mihad_activation_mandate_draft_v1';

export type ActivationMandateDraft = {
  draft_id: string;
  payload: ActivationRequestPayload;
  scoring?: ActivationScoringResult;
  saved_at: string;
};
