-- Add isAdmin field to users table
-- This migration adds admin functionality to the application

-- Step 1: Add isAdmin column with default value false
ALTER TABLE "users" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: (Optional) Set specific user as admin
-- Replace 'user@example.com' with the email of the user you want to make admin
-- UPDATE "users" SET "isAdmin" = true WHERE "email" = 'user@example.com';

-- Step 3: Verify the changes
-- SELECT id, email, name, "isAdmin" FROM "users";
