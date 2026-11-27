CREATE TABLE "admin_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"action" text NOT NULL,
	"target" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "view_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitor" text NOT NULL,
	"target" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "admin_events_created_idx" ON "admin_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "view_events_visitor_idx" ON "view_events" USING btree ("visitor","created_at");