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
      user_profiles: {
        Row: {
          user_id: string;
          date_of_birth: string | null;
          monthly_income: number | null;
          monthly_expense: number | null;
          number_of_dependents: number;
          onboarding_completed: boolean;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
