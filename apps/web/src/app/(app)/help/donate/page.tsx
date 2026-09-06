import { PageHeader } from '@/components/shared/PageHeader';
import { DonateContent } from '@/components/donate/DonateContent';

export default function HelpDonatePage() {
  return (
    <div>
      <PageHeader title="Donate" description="Support KashMap with a coffee or a UPI donation." />
      <DonateContent />
    </div>
  );
}
