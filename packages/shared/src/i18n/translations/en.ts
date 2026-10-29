/**
 * Canonical English dictionary — the source of truth for every translation key. Every other
 * locale file is typed as `Record<TranslationKey, string>`, so TypeScript fails the build if a
 * locale is missing a key this file defines, or has one this file doesn't (RULES.md-style
 * correctness-by-construction, same spirit as the goal icon map's exhaustive lookup).
 *
 * Scope deliberately stops at "common UI chrome" — sidebar navigation, toast confirmations for
 * core CRUD actions, and delete-confirmation dialogs — not full page-by-page translation.
 * Pro-upsell marketing copy and deep import-file-format instructions are intentionally left
 * English-only in every locale for now; they're sales/technical copy, not everyday chrome.
 */
export const en = {
  // Sidebar — top-level items
  "sidebar.dashboard": "Dashboard",
  "sidebar.transactions": "Transactions",
  "sidebar.investments": "Investments",
  "sidebar.portfolio": "Portfolio",
  "sidebar.calculators": "Calculators",
  "sidebar.goals": "Goals",
  "sidebar.cashbook": "Cashbook",
  "sidebar.insurance": "Insurance",

  // Sidebar — group labels
  "sidebar.group.assets": "Assets",
  "sidebar.group.reports": "Reports",
  "sidebar.group.config": "Config",
  "sidebar.group.settings": "Settings",
  "sidebar.group.help": "Help",

  // Sidebar — Assets children
  "sidebar.assets.fixedDeposits": "Fixed Deposits",
  "sidebar.assets.gold": "Gold",
  "sidebar.assets.loans": "Loans & Liabilities",
  "sidebar.assets.epf": "EPF",
  "sidebar.assets.nps": "NPS",
  "sidebar.assets.ssy": "SSY",
  "sidebar.assets.sgb": "SGB",
  "sidebar.assets.ulip": "ULIP",
  "sidebar.assets.realEstate": "Real Estate",
  "sidebar.assets.ppf": "PPF",
  "sidebar.assets.recurringDeposits": "Recurring Deposits",
  "sidebar.assets.nsc": "NSC",
  "sidebar.assets.vehicles": "Vehicles",
  "sidebar.assets.crypto": "Crypto",

  // Sidebar — Config children
  "sidebar.config.accounts": "Accounts",
  "sidebar.config.categories": "Categories & Sub-Categories",
  "sidebar.config.budgets": "Budgets",
  "sidebar.config.recurring": "Recurring",

  // Sidebar — Settings children
  "sidebar.settings.profile": "Profile",
  "sidebar.settings.billing": "Billing",
  "sidebar.settings.preferences": "Preferences",
  "sidebar.settings.dataPrivacy": "Data & Privacy",

  // Sidebar — Help children
  "sidebar.help.donate": "Donate",
  "sidebar.help.feedback": "Feedback",

  // Sidebar — report sub-group headers
  "sidebar.reports.expense": "Expense",
  "sidebar.reports.investment": "Investment",
  "sidebar.reports.combined": "Combined",

  // Sidebar — chrome
  "sidebar.backToDashboard": "Back to dashboard",
  "sidebar.expandSidebar": "Expand sidebar",
  "sidebar.collapseSidebar": "Collapse sidebar",
  "sidebar.signOut": "Sign out",

  // Mobile bottom nav — its own, shorter wording for the 4 primary tabs; "More" sheet reuses
  // the sidebar.* keys above for its own links.
  "nav.home": "Home",
  "nav.activity": "Activity",
  "nav.more": "More",
  "nav.addTransaction": "Add transaction",
  "nav.closeMenu": "Close menu",
  "nav.close": "Close",

  // Common actions (shared across dialogs/buttons)
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.deleting": "Deleting…",
  "common.cannotBeUndone": "This can't be undone.",
  "common.undoableForSeconds": "You can undo this for a few seconds after deleting.",
  "common.undo": "Undo",
  "aria.deleteTransaction": "Delete transaction",

  // Confirm-delete dialog titles
  "confirm.deleteGoal.title": "Delete goal?",
  "confirm.deletePolicy.title": "Delete policy?",
  "confirm.deleteBudgetLimit.title": "Delete budget limit?",
  "confirm.deleteRecurringTransaction.title": "Delete recurring transaction?",
  "confirm.deleteSnapshot.title": "Delete snapshot?",
  "confirm.deleteTransaction.title": "Delete transaction?",
  "confirm.deleteEntry.title": "Delete entry?",
  "confirm.deleteInvestment.title": "Delete investment?",
  "confirm.deleteAccount.title": 'Delete account "{name}"?',
  "confirm.deleteCategory.title": 'Delete category "{name}"?',
  "confirm.removeContact.title": 'Remove contact "{name}"?',
  "confirm.removeContact.description": "This will delete all cashbook entries and contact records for {name}.",
  "confirm.deleteTransactionsCount.title": "Delete {count} transaction?|Delete {count} transactions?",
  "confirm.deleteEntriesCount.title": "Delete {count} entry?|Delete {count} entries?",
  "confirm.deleteInvestmentsCount.title": "Delete {count} investment?|Delete {count} investments?",

  // Toasts — Transactions
  "toast.transaction.added": "Transaction added.",
  "toast.transaction.updated": "Transaction updated.",
  "toast.transaction.deleted": "Transaction deleted.",
  "toast.transactionsCount.deleted": "{count} transaction deleted.|{count} transactions deleted.",
  "toast.transaction.restoreFailed": "Couldn't restore that transaction.",
  "toast.transactions.restoreFailed": "Couldn't restore those transactions.",

  // Toasts — Investments
  "toast.investment.deleted": "Investment deleted.",
  "toast.investmentsCount.deleted": "{count} investment deleted.|{count} investments deleted.",
  "toast.investment.restoreFailed": "Couldn't restore that investment.",
  "toast.investments.restoreFailed": "Couldn't restore those investments.",

  // Toasts — Cashbook
  "toast.entry.deleted": "Entry deleted.",
  "toast.entriesCount.deleted": "{count} entry deleted.|{count} entries deleted.",
  "toast.cashbook.restoreFailed": "Couldn't restore that entry.",
  "toast.cashbooks.restoreFailed": "Couldn't restore those entries.",
  "toast.contact.removed": "Removed {name} and associated entries.",
  "toast.contact.removeFailed": "Failed to remove contact.",

  // Toasts — Profile / Settings / Data
  "toast.profile.pictureUpdated": "Profile picture updated.",
  "toast.profile.pictureUpdateFailed": "Could not update profile picture.",
  "toast.settings.updateFailed": "Could not update this setting. Please try again.",
  "toast.settings.languageSet": "Language preference set to {language}.",
  "toast.settings.currencySet": "Default currency set to {currency}.",
  "toast.settings.reportEmailOn": "You'll get your Overall Report by email on the 1st of every month.",
  "toast.settings.reportEmailOff": "Monthly report emails turned off.",
  "toast.data.exported": "Your data has been exported.",
  "toast.data.exportFailed": "Couldn't export your data, try again.",

  // Toasts — Portfolio price refresh
  "toast.prices.refreshFailed": "Failed to refresh prices.",
  "toast.prices.noHoldings": "No Stock/ETF holdings to refresh.",

  // Toasts — Feedback
  "toast.feedback.screenshotTooLarge": "Screenshot is too large — max 5MB.",
  "toast.feedback.sent": "Thanks for the feedback — it just landed in the inbox.",
  "toast.feedback.sendFailed": "Could not send feedback, please try again.",
} as const;

export type TranslationKey = keyof typeof en;
