CREATE TABLE "enrollment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"section_id" uuid NOT NULL,
	"school_year_id" uuid NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "grade_level" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "grade_level_sort_order_check" CHECK ("grade_level"."sort_order" between 1 and 20)
);
--> statement-breakpoint
CREATE TABLE "school_year" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "school_year_dates_check" CHECK ("school_year"."ends_on" > "school_year"."starts_on")
);
--> statement-breakpoint
CREATE TABLE "section" (
	"id" uuid PRIMARY KEY NOT NULL,
	"school_year_id" uuid NOT NULL,
	"grade_level_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "section_id_year_uq" UNIQUE("id","school_year_id")
);
--> statement-breakpoint
CREATE TABLE "section_adviser" (
	"id" uuid PRIMARY KEY NOT NULL,
	"section_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" text,
	"archived_at" timestamp with time zone,
	"archived_by" text
);
--> statement-breakpoint
CREATE TABLE "subject" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"grade_level_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "term" (
	"id" uuid PRIMARY KEY NOT NULL,
	"school_year_id" uuid NOT NULL,
	"sequence" smallint NOT NULL,
	"name" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "term_sequence_check" CHECK ("term"."sequence" between 1 and 3),
	CONSTRAINT "term_dates_check" CHECK ("term"."ends_on" > "term"."starts_on")
);
--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_section_year_fk" FOREIGN KEY ("section_id","school_year_id") REFERENCES "public"."section"("id","school_year_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section" ADD CONSTRAINT "section_school_year_id_school_year_id_fk" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_year"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section" ADD CONSTRAINT "section_grade_level_id_grade_level_id_fk" FOREIGN KEY ("grade_level_id") REFERENCES "public"."grade_level"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_adviser" ADD CONSTRAINT "section_adviser_section_id_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."section"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_adviser" ADD CONSTRAINT "section_adviser_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_adviser" ADD CONSTRAINT "section_adviser_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_adviser" ADD CONSTRAINT "section_adviser_archived_by_user_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject" ADD CONSTRAINT "subject_grade_level_id_grade_level_id_fk" FOREIGN KEY ("grade_level_id") REFERENCES "public"."grade_level"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term" ADD CONSTRAINT "term_school_year_id_school_year_id_fk" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_year"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enrollment_section_year_idx" ON "enrollment" USING btree ("section_id","school_year_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_student_year_active_uq" ON "enrollment" USING btree ("student_id","school_year_id") WHERE "enrollment"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "enrollment_student_idx" ON "enrollment" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grade_level_name_uq" ON "grade_level" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "grade_level_sort_order_uq" ON "grade_level" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "school_year_name_uq" ON "school_year" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "school_year_one_current_uq" ON "school_year" USING btree ("is_current") WHERE "school_year"."is_current";--> statement-breakpoint
CREATE UNIQUE INDEX "section_year_name_uq" ON "section" USING btree ("school_year_id","name");--> statement-breakpoint
CREATE INDEX "section_grade_level_idx" ON "section" USING btree ("grade_level_id");--> statement-breakpoint
CREATE UNIQUE INDEX "section_adviser_active_uq" ON "section_adviser" USING btree ("section_id","user_id") WHERE "section_adviser"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "section_adviser_section_idx" ON "section_adviser" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "section_adviser_user_idx" ON "section_adviser" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "section_adviser_assigned_by_idx" ON "section_adviser" USING btree ("assigned_by");--> statement-breakpoint
CREATE INDEX "section_adviser_archived_by_idx" ON "section_adviser" USING btree ("archived_by");--> statement-breakpoint
CREATE UNIQUE INDEX "subject_code_uq" ON "subject" USING btree ("code");--> statement-breakpoint
CREATE INDEX "subject_grade_level_idx" ON "subject" USING btree ("grade_level_id");--> statement-breakpoint
CREATE UNIQUE INDEX "term_year_sequence_uq" ON "term" USING btree ("school_year_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "term_year_name_uq" ON "term" USING btree ("school_year_id","name");