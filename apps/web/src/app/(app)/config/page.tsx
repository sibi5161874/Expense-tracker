'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { AccountsTab } from '@/components/settings/AccountsTab';
import { CategoriesTab } from '@/components/settings/CategoriesTab';
import { BudgetsTab } from '@/components/settings/BudgetsTab';
import { RecurringTab } from '@/components/settings/RecurringTab';

type ConfigTab = 'accounts' | 'categories' | 'budgets' | 'recurring';

function isConfigTab(value: string | null): value is ConfigTab {
  return value === 'accounts' || value === 'categories' || value === 'budgets' || value === 'recurring';
}

export default function ConfigPage() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<ConfigTab>(() => (isConfigTab(urlTab) ? urlTab : 'accounts'));

  // The sidebar links here with a different `?tab=` on same-route navigation, which local
  // state alone won't pick up. This is React's documented "adjusting state when a prop
  // changes" pattern — compare during render and call setState conditionally, instead of in
  // an effect, so switching tabs doesn't cost an extra render + paint round trip. It only
  // fires when the URL names a tab that differs from what's showing, so it never fights a
  // same-render click (clicking a tab doesn't change the URL here).
  if (isConfigTab(urlTab) && urlTab !== activeTab) {
    setActiveTab(urlTab);
  }

  return (
    <div>
      <PageHeader title="Config" description="Accounts, categories, sub-categories, and budget limits." />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ConfigTab)}>
        {/* Issue #21: switching between these tabs only existed as the desktop Sidebar's
            nested "Config" group — reachable on mobile only by hard-coding ?tab= in the URL,
            with no way to discover or switch tabs once on the page. Desktop keeps using the
            sidebar (unchanged) via `md:hidden`; this is purely the mobile-visible equivalent. */}
        <TabsList className="mb-2 w-full md:hidden">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts" className="mt-6">
          <AccountsTab />
        </TabsContent>
        <TabsContent value="categories" className="mt-6">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="budgets" className="mt-6">
          <BudgetsTab />
        </TabsContent>
        <TabsContent value="recurring" className="mt-6">
          <RecurringTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
