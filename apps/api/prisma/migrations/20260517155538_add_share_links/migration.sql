-- CreateTable
CREATE TABLE "share_links" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "file_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "password_hash" TEXT,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");

-- CreateIndex
CREATE INDEX "share_links_owner_id_idx" ON "share_links"("owner_id");

-- CreateIndex
CREATE INDEX "share_links_file_id_idx" ON "share_links"("file_id");

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
