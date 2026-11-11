'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { PreferencesTab } from '@/components/settings/PreferencesTab';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { DataTab } from '@/components/settings/DataTab';
import { BillingTab } from '@/components/settings/BillingTab';

type SettingsTab = 'profile' | 'preferences' | 'data' | 'billing';

function isSettingsTab(value: string | null): value is SettingsTab {
  return value === 'profile' || value === 'preferences' || value === 'data' || value === 'billing';
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => (isSettingsTab(urlTab) ? urlTab : 'profile'));

  // React's documented "adjusting state when a prop changes" pattern — see the identical
  // comment in app/(app)/config/page.tsx for why this replaces a useEffect here.
  if (isSettingsTab(urlTab) && urlTab !== activeTab) {
    setActiveTab(urlTab);
  }

  return (
    <div>
      <PageHeader title="Settings" description="Your profile, plan, and app preferences." />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
        {/* Issue #21: mobile-visible equivalent of the desktop Sidebar's nested "Settings"
            group — see the identical comment in app/(app)/config/page.tsx. */}
        <TabsList className="mb-2 w-full md:hidden">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="billing" className="mt-6">
          <BillingTab />
        </TabsContent>
        <TabsContent value="preferences" className="mt-6">
          <PreferencesTab />
        </TabsContent>
        <TabsContent value="data" className="mt-6">
          <DataTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
