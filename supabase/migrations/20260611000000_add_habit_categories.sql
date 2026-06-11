/*
  # Add category column to habits table

  1. Changes
    - Add `category` column (text, optional) to `habits` table.
      This allows grouping and filtering habits on the dashboard.
*/

ALTER TABLE habits
ADD COLUMN IF NOT EXISTS category TEXT;
