import { BuyerOpsPlaceholder } from '@/components/app/BuyerOpsPlaceholder';

export default function PartnersPage() {
  return (
    <BuyerOpsPlaceholder
      title="Partners"
      subtitle="Manage brokers, prefab suppliers, and supporting service partners."
    >
      <p>
        Partner data is backed by the unified partner and prefab supplier profile tables. Public supplier discovery now
        reads from the same records that operations will use for introductions and scorecards.
      </p>
    </BuyerOpsPlaceholder>
  );
}
