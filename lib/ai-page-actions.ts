export const AI_CREDIT_APPLICATION_DRAFT_EVENT =
  "ai:credit-application-draft";

export type AiCreditApplicationDraft = {
  applicationId: string;
  description: string;
};

export function getAiCreditApplicationDraftKey(applicationId: string) {
  return `ai.credit-application.draft.${applicationId.trim().toUpperCase()}`;
}
