import { BuyerOpsPlaceholder } from '@/components/app/BuyerOpsPlaceholder';

export default function ApprovalsPage() {
  return (
    <BuyerOpsPlaceholder
      title="Approvals"
      subtitle="Gate packet sharing, supplier outreach, and external partner actions."
    >
      <p>
        Approval gates are the control point for outbound supplier or broker actions. This keeps Mihad as a guided RFQ
        engine instead of an autonomous outreach system.
      </p>
    </BuyerOpsPlaceholder>
  );
}
