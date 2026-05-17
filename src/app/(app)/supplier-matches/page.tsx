import { BuyerOpsPlaceholder } from '@/components/app/BuyerOpsPlaceholder';

export default function SupplierMatchesPage() {
  return (
    <BuyerOpsPlaceholder
      title="Supplier Matches"
      subtitle="Track shortlist decisions and supplier-specific RFQ readiness."
    >
      <p>
        Supplier match operations are anchored to RFQs and buyer desks. Use this lane for the next build-out of ranked
        supplier recommendations, quote status, and response SLA tracking.
      </p>
    </BuyerOpsPlaceholder>
  );
}
