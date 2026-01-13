ALTER TABLE `pastes` ADD COLUMN `content_type` text DEFAULT 'html' NOT NULL;
--> statement-breakpoint
ALTER TABLE `pastes` ADD COLUMN `is_protected` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `pastes` ADD COLUMN `share_password` text DEFAULT '';
