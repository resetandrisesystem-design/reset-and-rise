export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface DailyEntry {
  id: string;
  user_id: string;
  entry_date: string;
  priority_1: string | null;
  priority_2: string | null;
  priority_3: string | null;
  block_morning: string | null;
  block_afternoon: string | null;
  block_evening: string | null;
  affirmation: string | null;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  completed: boolean;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  entry_date: string;
  mood: "low" | "okay" | "good" | "calm" | "rising" | null;
  stress_level: number | null;
  brain_dump: string | null;
  reflection: string | null;
  peace_bank: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceEntry {
  id: string;
  user_id: string;
  month: string;
  income: number;
  exp_rent: number;
  exp_groceries: number;
  exp_children: number;
  exp_selfcare: number;
  exp_savings: number;
  exp_other: number;
  savings_goal: number;
  savings_saved: number;
  mindset_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  week_start: string;
  grocery_list: string | null;
  batch_sunday: string | null;
  batch_midweek: string | null;
  meal_entries?: MealEntry[];
  created_at: string;
  updated_at: string;
}

export interface MealEntry {
  id: string;
  plan_id: string;
  user_id: string;
  day_label: string;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  prompt_used: string | null;
  journal_text: string | null;
  ai_response: string | null;
  gratitude_1: string | null;
  gratitude_2: string | null;
  gratitude_3: string | null;
  tonight_intention: string | null;
  created_at: string;
  updated_at: string;
}
