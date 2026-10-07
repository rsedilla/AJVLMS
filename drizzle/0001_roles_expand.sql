CREATE TABLE "user_role" (
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"granted_by" text,
	CONSTRAINT "user_role_user_id_role_pk" PRIMARY KEY("user_id","role"),
	CONSTRAINT "user_role_role_check" CHECK ("user_role"."role" in ('student', 'parent', 'staff', 'principal', 'admin'))
);
--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_role_granted_by_idx" ON "user_role" USING btree ("granted_by");