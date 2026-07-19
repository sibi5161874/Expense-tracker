'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { AccountsTab } from '@/components/settings/AccountsTab';
import { CategoriesTab } from '@/components/settings/CategoriesTab';
import { BudgetsTab } from '@/components/settings/BudgetsTab';

type ConfigTab = 'accounts' | 'categories' | 'budgets';

function isConfigTab(value: string | null): value is ConfigTab {
  return value === 'accounts' || value === 'categories' || value === 'budgets';
}

export default function ConfigPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ConfigTab>(() => {
    const tab = searchParams.get('tab');
    return isConfigTab(tab) ? tab : 'accounts';
  });

  // Sidebar sub-nav links to /config?tab=categories etc.; sync on same-route navigation.
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (isConfigTab(tab)) setActiveTab(tab);
  }, [searchParams]);

  return (
    <div>
      <PageHeader title="Config" description="Accounts, categories, sub-categories, and budget limits." />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ConfigTab)}>
        <TabsContent value="accounts" className="mt-6">
          <AccountsTab />
        </TabsContent>
        <TabsContent value="categories" className="mt-6">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="budgets" className="mt-6">
          <BudgetsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
