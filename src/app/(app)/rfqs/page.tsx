import { BuyerOpsPlaceholder } from '@/components/app/BuyerOpsPlaceholder';

export default function RfqsPage() {
  return (
    <BuyerOpsPlaceholder
      title="RFQs"
      subtitle="Review public prefab requests, readiness gaps, and next actions."
    >
      <p>
        The canonical RFQ queue still lives in the buyer desk workspace for this pass. This lane replaces the old
        workspace language and keeps operators focused on structured prefab requests.
      </p>
    </BuyerOpsPlaceholder>
  );
}
