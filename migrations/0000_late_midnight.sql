CREATE TABLE `askbrian_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`cast_hash` text,
	`cast_text` text,
	`cast_author_custody_address` text,
	`cast_author_verified_eth_addresses` text,
	`brian_input_origin_wallet` text,
	`brian_input_prompt` text,
	`brian_response` text,
	`frame_data` text,
	`redis_operation_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `foo` (
	`bar` text DEFAULT 'Hey!' NOT NULL
);
