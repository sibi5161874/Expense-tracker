/**
 * Hand-written placeholder matching supabase/migrations exactly.
 * Replace by running (after linking the project):
 *   pnpm supabase gen types typescript --linked > packages/shared/src/types/database.types.ts
 * Regenerate any time the schema changes — never hand-edit table shapes below.
 */

export type TransactionType = "Income" | "Expense" | "Transfer";
export type InvestmentAction = "BUY" | "SELL" | "SIP" | "DIVIDEND" | "BONUS" | "SPLIT";
export type AssetType = "Stock" | "ETF" | "Mutual Fund" | "Crypto" | "Bond" | "Other";
export type CashFlow = "Gave" | "Received";
export type GoalPriority = "High" | "Medium" | "Low";
export type NpsTier = "Tier I" | "Tier II";
export type UlipPremiumFrequency = "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly";
export type InsurancePolicyType = "Term" | "Health" | "Motor" | "Other";
export type RecurringFrequency = "Weekly" | "Monthly" | "Quarterly" | "Yearly";
export type RealEstatePropertyType = "Residential" | "Commercial" | "Land" | "Other";
export type VehicleType = "Car" | "Two Wheeler" | "Commercial" | "Other";
export type SubscriptionTier = "free" | "trial" | "pro";
export type PaymentPurpose = "trial_verification" | "lifetime_purchase";
export type PaymentStatus = "created" | "captured" | "refunded" | "failed";

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          opening_balance: number;
          currency: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          opening_balance?: number;
          currency?: string;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["accounts"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: TransactionType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: TransactionType;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      budget_limits: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          monthly_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          monthly_limit: number;
        };
        Update: Partial<Database["public"]["Tables"]["budget_limits"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "budget_limits_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          type: TransactionType;
          category_id: string | null;
          sub_category: string | null;
          amount: number;
          from_account_id: string;
          to_account_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          type: TransactionType;
          category_id?: string | null;
          sub_category?: string | null;
          amount: number;
          from_account_id: string;
          to_account_id?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_from_account_id_fkey";
            columns: ["from_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey";
            columns: ["to_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      investment_log: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          symbol: string;
          exchange: string;
          action: InvestmentAction;
          quantity: number;
          price: number;
          fees: number;
          bonus_split_extra_units: number | null;
          linked_account_id: string;
          asset_type: AssetType;
          notes: string | null;
          total_cashflow: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          symbol: string;
          exchange: string;
          action: InvestmentAction;
          quantity: number;
          price: number;
          fees?: number;
          bonus_split_extra_units?: number | null;
          linked_account_id: string;
          asset_type: AssetType;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["investment_log"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "investment_log_linked_account_id_fkey";
            columns: ["linked_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      holdings: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          display_name: string | null;
          live_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          display_name?: string | null;
          live_price?: number;
        };
        Update: Partial<Database["public"]["Tables"]["holdings"]["Insert"]>;
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          goal_name: string;
          category: string;
          target_amount: number;
          saved_amount: number;
          target_date: string;
          priority: GoalPriority;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_name: string;
          category: string;
          target_amount: number;
          saved_amount?: number;
          target_date: string;
          priority: GoalPriority;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Insert"]>;
        Relationships: [];
      };
      cashbook: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          counterparty: string;
          flow: CashFlow;
          amount: number;
          due_date: string | null;
          account_used_id: string | null;
          loan_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          counterparty: string;
          flow: CashFlow;
          amount: number;
          due_date?: string | null;
          account_used_id?: string | null;
          loan_id?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["cashbook"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "cashbook_account_used_id_fkey";
            columns: ["account_used_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      assets_fixed_deposits: {
        Row: {
          id: string;
          user_id: string;
          bank: string;
          principal: number;
          maturity_value: number;
          maturity_date: string;
          rate_pct: number;
          withdrawn: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bank: string;
          principal: number;
          maturity_value: number;
          maturity_date: string;
          rate_pct: number;
          withdrawn?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["assets_fixed_deposits"]["Insert"]>;
        Relationships: [];
      };
      assets_gold: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          grams: number;
          rate_per_gram: number;
          purchase_value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          grams: number;
          rate_per_gram: number;
          purchase_value: number;
        };
        Update: Partial<Database["public"]["Tables"]["assets_gold"]["Insert"]>;
        Relationships: [];
      };
      assets_loans_liabilities: {
        Row: {
          id: string;
          user_id: string;
          lender: string;
          outstanding: number;
          emi: number | null;
          interest_rate_pct: number | null;
          months_left: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lender: string;
          outstanding: number;
          emi?: number | null;
          interest_rate_pct?: number | null;
          months_left?: number | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["assets_loans_liabilities"]["Insert"]>;
        Relationships: [];
      };
      assets_epf: {
        Row: {
          id: string;
          user_id: string;
          employer_name: string;
          current_balance: number;
          monthly_contribution: number;
          uan_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          employer_name: string;
          current_balance: number;
          monthly_contribution: number;
          uan_number?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["assets_epf"]["Insert"]>;
        Relationships: [];
      };
      assets_nps: {
        Row: {
          id: string;
          user_id: string;
          pran_number: string;
          current_value: number;
          tier: NpsTier;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pran_number: string;
          current_value: number;
          tier?: NpsTier;
        };
        Update: Partial<Database["public"]["Tables"]["assets_nps"]["Insert"]>;
        Relationships: [];
      };
      assets_ssy: {
        Row: {
          id: string;
          user_id: string;
          account_holder_name: string;
          account_number: string;
          current_balance: number;
          opening_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_holder_name: string;
          account_number: string;
          current_balance: number;
          opening_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["assets_ssy"]["Insert"]>;
        Relationships: [];
      };
      assets_sgb: {
        Row: {
          id: string;
          user_id: string;
          units_held: number;
          issue_price: number;
          issue_date: string;
          rate_per_gram: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          units_held: number;
          issue_price: number;
          issue_date: string;
          rate_per_gram: number;
        };
        Update: Partial<Database["public"]["Tables"]["assets_sgb"]["Insert"]>;
        Relationships: [];
      };
      assets_ulip: {
        Row: {
          id: string;
          user_id: string;
          insurer: string;
          policy_number: string;
          sum_assured: number;
          current_fund_value: number;
          premium_amount: number;
          premium_frequency: UlipPremiumFrequency;
          maturity_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          insurer: string;
          policy_number: string;
          sum_assured: number;
          current_fund_value: number;
          premium_amount: number;
          premium_frequency?: UlipPremiumFrequency;
          maturity_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["assets_ulip"]["Insert"]>;
        Relationships: [];
      };
      assets_real_estate: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          property_type: RealEstatePropertyType;
          location: string | null;
          purchase_value: number;
          current_value: number;
          purchase_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          property_type: RealEstatePropertyType;
          location?: string | null;
          purchase_value: number;
          current_value: number;
          purchase_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["assets_real_estate"]["Insert"]>;
        Relationships: [];
      };
      assets_ppf: {
        Row: {
          id: string;
          user_id: string;
          account_number: string;
          current_balance: number;
          annual_contribution: number;
          opening_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_number: string;
          current_balance: number;
          annual_contribution: number;
          opening_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["assets_ppf"]["Insert"]>;
        Relationships: [];
      };
      assets_recurring_deposits: {
        Row: {
          id: string;
          user_id: string;
          bank: string;
          monthly_installment: number;
          rate_pct: number;
          start_date: string;
          maturity_date: string;
          maturity_value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bank: string;
          monthly_installment: number;
          rate_pct: number;
          start_date: string;
          maturity_date: string;
          maturity_value: number;
        };
        Update: Partial<Database["public"]["Tables"]["assets_recurring_deposits"]["Insert"]>;
        Relationships: [];
      };
      assets_nsc: {
        Row: {
          id: string;
          user_id: string;
          certificate_number: string;
          purchase_value: number;
          maturity_value: number;
          rate_pct: number;
          purchase_date: string;
          maturity_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          certificate_number: string;
          purchase_value: number;
          maturity_value: number;
          rate_pct: number;
          purchase_date: string;
          maturity_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["assets_nsc"]["Insert"]>;
        Relationships: [];
      };
      assets_vehicles: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          vehicle_type: VehicleType;
          registration_number: string | null;
          purchase_value: number;
          current_value: number;
          purchase_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          vehicle_type: VehicleType;
          registration_number?: string | null;
          purchase_value: number;
          current_value: number;
          purchase_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["assets_vehicles"]["Insert"]>;
        Relationships: [];
      };
      net_worth_snapshots: {
        Row: {
          id: string;
          user_id: string;
          snapshot_date: string;
          cash_and_bank_total: number;
          fixed_deposits_total: number;
          gold_total: number;
          epf_total: number;
          nps_total: number;
          ssy_total: number;
          sgb_total: number;
          ulip_total: number;
          real_estate_total: number;
          ppf_total: number;
          recurring_deposits_total: number;
          nsc_total: number;
          vehicles_total: number;
          portfolio_value: number;
          liabilities_total: number;
          net_worth: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          snapshot_date: string;
          cash_and_bank_total?: number;
          fixed_deposits_total?: number;
          gold_total?: number;
          epf_total?: number;
          nps_total?: number;
          ssy_total?: number;
          sgb_total?: number;
          ulip_total?: number;
          real_estate_total?: number;
          ppf_total?: number;
          recurring_deposits_total?: number;
          nsc_total?: number;
          vehicles_total?: number;
          portfolio_value?: number;
          liabilities_total?: number;
          net_worth: number;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["net_worth_snapshots"]["Insert"]>;
        Relationships: [];
      };
      monthly_email_logs: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          sent_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_email_logs"]["Insert"]>;
        Relationships: [];
      };
      payment_events: {
        Row: {
          id: string;
          user_id: string;
          purpose: PaymentPurpose;
          amount_paise: number;
          razorpay_order_id: string;
          razorpay_payment_id: string | null;
          razorpay_refund_id: string | null;
          status: PaymentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          purpose: PaymentPurpose;
          amount_paise: number;
          razorpay_order_id: string;
          razorpay_payment_id?: string | null;
          razorpay_refund_id?: string | null;
          status?: PaymentStatus;
        };
        Update: Partial<Database["public"]["Tables"]["payment_events"]["Insert"]>;
        Relationships: [];
      };
      user_profiles: {
        Row: {
          user_id: string;
          date_of_birth: string | null;
          monthly_income: number | null;
          monthly_expense: number | null;
          number_of_dependents: number;
          onboarding_completed: boolean;
          monthly_report_email_enabled: boolean;
          avatar_url: string | null;
          tier: SubscriptionTier;
          trial_started_at: string | null;
          trial_ends_at: string | null;
          lifetime_purchased_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          date_of_birth?: string | null;
          monthly_income?: number | null;
          monthly_expense?: number | null;
          number_of_dependents?: number;
          onboarding_completed?: boolean;
          monthly_report_email_enabled?: boolean;
          avatar_url?: string | null;
          tier?: SubscriptionTier;
          trial_started_at?: string | null;
          trial_ends_at?: string | null;
          lifetime_purchased_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
        Relationships: [];
      };
      insurance_policies: {
        Row: {
          id: string;
          user_id: string;
          policy_type: InsurancePolicyType;
          insurer: string;
          policy_number: string;
          coverage_amount: number;
          premium_amount: number;
          premium_due_date: string;
          nominee: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          policy_type: InsurancePolicyType;
          insurer: string;
          policy_number: string;
          coverage_amount: number;
          premium_amount: number;
          premium_due_date: string;
          nominee?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["insurance_policies"]["Insert"]>;
        Relationships: [];
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: TransactionType;
          category_id: string | null;
          sub_category: string | null;
          amount: number;
          from_account_id: string;
          to_account_id: string | null;
          notes: string | null;
          frequency: RecurringFrequency;
          next_run_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: TransactionType;
          category_id?: string | null;
          sub_category?: string | null;
          amount: number;
          from_account_id: string;
          to_account_id?: string | null;
          notes?: string | null;
          frequency: RecurringFrequency;
          next_run_date: string;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["recurring_transactions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_transactions_from_account_id_fkey";
            columns: ["from_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_transactions_to_account_id_fkey";
            columns: ["to_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      assets_crypto: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          name: string | null;
          quantity: number;
          buy_price: number;
          current_price: number;
          wallet_or_exchange: string | null;
          purchase_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          name?: string | null;
          quantity: number;
          buy_price: number;
          current_price: number;
          wallet_or_exchange?: string | null;
          purchase_date: string;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["assets_crypto"]["Insert"]>;
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: {
      get_monthly_category_breakdown: {
        Args: { p_month: string; p_user_id: string };
        Returns: { amount: number; category_name: string }[];
      };
      get_monthly_transaction_summary: {
        Args: { p_month: string; p_user_id: string };
        Returns: { expense: number; income: number }[];
      };
      get_monthly_trend: {
        Args: { p_months_back: number; p_user_id: string };
        Returns: { expense: number; income: number; month: string }[];
      };
      reserve_payment_order: {
        Args: { p_purpose: string; p_amount_paise: number; p_placeholder_order_id: string };
        Returns: { id: string; razorpay_order_id: string; amount_paise: number; reserved_by_me: boolean }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
