-- Add unreadCount and lastReadAt columns to room_members table
ALTER TABLE "room_members" 
ADD COLUMN "unreadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastReadAt" TIMESTAMP(3);

-- Add index for better query performance
CREATE INDEX "room_members_unreadCount_idx" ON "room_members"("unreadCount");
