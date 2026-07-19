'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { PreferencesTab } from '@/components/settings/PreferencesTab';
import { ProfileTab } from '@/components/settings/ProfileTab';

type SettingsTab = 'profile' | 'preferences';

function isSettingsTab(value: string | null): value is SettingsTab {
  return value === 'profile' || value === 'preferences';
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const tab = searchParams.get('tab');
    return isSettingsTab(tab) ? tab : 'profile';
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (isSettingsTab(tab)) setActiveTab(tab);
  }, [searchParams]);

  return (
    <div>
      <PageHeader title="Settings" description="Your profile and app preferences." />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="preferences" className="mt-6">
          <PreferencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
