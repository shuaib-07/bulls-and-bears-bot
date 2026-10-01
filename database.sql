CREATE SCHEMA "public";
CREATE SCHEMA "neon_auth";
CREATE TABLE "direct_sell_offers" (
	"id" text PRIMARY KEY,
	"seller_team_id" text NOT NULL,
	"seller_team_name" text NOT NULL,
	"buyer_team_id" text NOT NULL,
	"buyer_team_name" text NOT NULL,
	"ticker" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"simulation_id" uuid,
	"round_number" integer
);
CREATE TABLE "game_state" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"current_round" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'SETUP' NOT NULL,
	"trading_expires_at" timestamp with time zone,
	"market_expanded" boolean DEFAULT false NOT NULL,
	"leaderboard_visible" boolean DEFAULT false NOT NULL,
	"stage_audit_visible" boolean DEFAULT true NOT NULL,
	"stock_prices" jsonb DEFAULT '{}' NOT NULL,
	"stock_floats" jsonb DEFAULT '{}' NOT NULL,
	"custom_scenarios" jsonb DEFAULT '{}' NOT NULL,
	"custom_price_shifts" jsonb DEFAULT '{}' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"simulation_snapshot" jsonb,
	"revision" bigint DEFAULT 0 NOT NULL,
	"last_write_token" uuid,
	"simulation_id" uuid
);
CREATE TABLE "stocks" (
	"ticker" text PRIMARY KEY,
	"name" text NOT NULL,
	"sector" text NOT NULL,
	"max_supply" integer DEFAULT 100 NOT NULL,
	"available_supply" integer DEFAULT 100 NOT NULL,
	"current_price" numeric(10, 2) NOT NULL,
	"entry_round" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
CREATE TABLE "swap_offers" (
	"id" text PRIMARY KEY,
	"sender_team_id" text NOT NULL,
	"receiver_team_id" text NOT NULL,
	"give_ticker" text NOT NULL,
	"give_quantity" integer NOT NULL,
	"receive_ticker" text NOT NULL,
	"receive_quantity" integer NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"simulation_id" uuid,
	"round_number" integer
);
CREATE TABLE "team_members" (
	"id" text PRIMARY KEY,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"roll_no" text,
	"phone" text,
	"role" text DEFAULT 'Member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "teams" (
	"id" text PRIMARY KEY,
	"team_name" text NOT NULL CONSTRAINT "teams_team_name_key" UNIQUE,
	"passcode" text NOT NULL,
	"cash_balance" numeric(12, 2) DEFAULT '100000.00' NOT NULL,
	"is_frozen" boolean DEFAULT false NOT NULL,
	"table_number" text,
	"portfolio" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_ready" boolean DEFAULT false NOT NULL,
	"peer_trades_by_round" jsonb DEFAULT '{}' NOT NULL
);
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY,
	"round_number" integer NOT NULL,
	"team_id" text NOT NULL,
	"team_name" text NOT NULL,
	"transaction_type" text NOT NULL,
	"ticker" text NOT NULL,
	"quantity" integer NOT NULL,
	"price_per_share" numeric(10, 2) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"counterparty_team_id" text,
	"counterparty_team_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"simulation_id" uuid,
	"gross_total" numeric(12, 2),
	"commission_amount" numeric(12, 2),
	"commission_percent" numeric,
	"display_timestamp" text
);
CREATE TABLE "neon_auth"."account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" uuid NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
CREATE TABLE "neon_auth"."invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organizationId" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"inviterId" uuid NOT NULL
);
CREATE TABLE "neon_auth"."jwks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"publicKey" text NOT NULL,
	"privateKey" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"expiresAt" timestamp with time zone
);
CREATE TABLE "neon_auth"."member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organizationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
CREATE TABLE "neon_auth"."organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL CONSTRAINT "organization_slug_key" UNIQUE,
	"logo" text,
	"createdAt" timestamp with time zone NOT NULL,
	"metadata" text
);
CREATE TABLE "neon_auth"."project_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"endpoint_id" text NOT NULL CONSTRAINT "project_config_endpoint_id_key" UNIQUE,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"trusted_origins" jsonb NOT NULL,
	"social_providers" jsonb NOT NULL,
	"email_provider" jsonb,
	"email_and_password" jsonb,
	"allow_localhost" boolean NOT NULL,
	"plugin_configs" jsonb,
	"webhook_config" jsonb
);
CREATE TABLE "neon_auth"."session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL CONSTRAINT "session_token_key" UNIQUE,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" uuid NOT NULL,
	"impersonatedBy" text,
	"activeOrganizationId" text
);
CREATE TABLE "neon_auth"."user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL CONSTRAINT "user_email_key" UNIQUE,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"role" text,
	"banned" boolean,
	"banReason" text,
	"banExpires" timestamp with time zone
);
CREATE TABLE "neon_auth"."verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX "direct_sell_offers_pkey" ON "direct_sell_offers" ("id");
CREATE UNIQUE INDEX "game_state_pkey" ON "game_state" ("id");
CREATE UNIQUE INDEX "stocks_pkey" ON "stocks" ("ticker");
CREATE UNIQUE INDEX "swap_offers_pkey" ON "swap_offers" ("id");
CREATE UNIQUE INDEX "team_members_pkey" ON "team_members" ("id");
CREATE UNIQUE INDEX "teams_pkey" ON "teams" ("id");
CREATE UNIQUE INDEX "teams_team_name_key" ON "teams" ("team_name");
CREATE UNIQUE INDEX "transactions_pkey" ON "transactions" ("id");
CREATE UNIQUE INDEX "account_pkey" ON "neon_auth"."account" ("id");
CREATE INDEX "account_userId_idx" ON "neon_auth"."account" ("userId");
CREATE INDEX "invitation_email_idx" ON "neon_auth"."invitation" ("email");
CREATE INDEX "invitation_organizationId_idx" ON "neon_auth"."invitation" ("organizationId");
CREATE UNIQUE INDEX "invitation_pkey" ON "neon_auth"."invitation" ("id");
CREATE UNIQUE INDEX "jwks_pkey" ON "neon_auth"."jwks" ("id");
CREATE INDEX "member_organizationId_idx" ON "neon_auth"."member" ("organizationId");
CREATE UNIQUE INDEX "member_pkey" ON "neon_auth"."member" ("id");
CREATE INDEX "member_userId_idx" ON "neon_auth"."member" ("userId");
CREATE UNIQUE INDEX "organization_pkey" ON "neon_auth"."organization" ("id");
CREATE UNIQUE INDEX "organization_slug_key" ON "neon_auth"."organization" ("slug");
CREATE UNIQUE INDEX "organization_slug_uidx" ON "neon_auth"."organization" ("slug");
CREATE UNIQUE INDEX "project_config_endpoint_id_key" ON "neon_auth"."project_config" ("endpoint_id");
CREATE UNIQUE INDEX "project_config_pkey" ON "neon_auth"."project_config" ("id");
CREATE UNIQUE INDEX "session_pkey" ON "neon_auth"."session" ("id");
CREATE UNIQUE INDEX "session_token_key" ON "neon_auth"."session" ("token");
CREATE INDEX "session_userId_idx" ON "neon_auth"."session" ("userId");
CREATE UNIQUE INDEX "user_email_key" ON "neon_auth"."user" ("email");
CREATE UNIQUE INDEX "user_pkey" ON "neon_auth"."user" ("id");
CREATE INDEX "verification_identifier_idx" ON "neon_auth"."verification" ("identifier");
CREATE UNIQUE INDEX "verification_pkey" ON "neon_auth"."verification" ("id");
ALTER TABLE "direct_sell_offers" ADD CONSTRAINT "direct_sell_offers_buyer_team_id_fkey" FOREIGN KEY ("buyer_team_id") REFERENCES "teams"("id") ON DELETE CASCADE;
ALTER TABLE "direct_sell_offers" ADD CONSTRAINT "direct_sell_offers_seller_team_id_fkey" FOREIGN KEY ("seller_team_id") REFERENCES "teams"("id") ON DELETE CASCADE;
ALTER TABLE "swap_offers" ADD CONSTRAINT "swap_offers_receiver_team_id_fkey" FOREIGN KEY ("receiver_team_id") REFERENCES "teams"("id") ON DELETE CASCADE;
ALTER TABLE "swap_offers" ADD CONSTRAINT "swap_offers_sender_team_id_fkey" FOREIGN KEY ("sender_team_id") REFERENCES "teams"("id") ON DELETE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "neon_auth"."organization"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "neon_auth"."organization"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;