-- This SQL will help if you have existing customers with old accountCategory enum values
-- Run this in your MySQL database if needed

-- First, create a default category if it doesn't exist
INSERT IGNORE INTO accountCategory (name, isActive, createdAt, updatedAt)
VALUES ('Regular', true, NOW(), NOW());

-- Get the ID of the Regular category
SET @regularId = (SELECT id FROM accountCategory WHERE name = 'Regular' LIMIT 1);

-- Update all customers that don't have an accountCategoryId
UPDATE customer 
SET accountCategoryId = @regularId 
WHERE accountCategoryId IS NULL;
