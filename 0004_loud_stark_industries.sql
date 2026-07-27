CREATE TABLE "sample_paper_solutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sample_paper_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"youtube_url" text NOT NULL,
	"solution_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sample_papers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_type" text NOT NULL,
	"test_type" text DEFAULT 'chapterwise' NOT NULL,
	"test_name" text NOT NULL,
	"test_order" integer DEFAULT 1 NOT NULL,
	"syllabus_pdf_url" text NOT NULL,
	"test_pdf_url" text NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "daily_dose" ADD COLUMN "motivation_image_url" text;--> statement-breakpoint
ALTER TABLE "sample_paper_solutions" ADD CONSTRAINT "sample_paper_solutions_sample_paper_id_sample_papers_id_fk" FOREIGN KEY ("sample_paper_id") REFERENCES "public"."sample_papers"("id") ON DELETE cascade ON UPDATE no action;