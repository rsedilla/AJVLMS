-- Custom SQL migration file, put your code below! --
-- Roles step 2 of 3 (migrate). ADR 0005: copy each user's single legacy role into user_role.
-- teacher/adviser → staff ("adviser" becomes an assignment, added with the school feature).
-- Idempotent: safe if a row already exists.
INSERT INTO "user_role" ("user_id", "role")
SELECT "id",
       CASE "role"::text
         WHEN 'teacher' THEN 'staff'
         WHEN 'adviser' THEN 'staff'
         ELSE "role"::text
       END
FROM "user"
ON CONFLICT ("user_id", "role") DO NOTHING;
