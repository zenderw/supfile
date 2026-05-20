-- CreateTable
CREATE TABLE "folder_shares" (
    "id" UUID NOT NULL,
    "folder_id" UUID NOT NULL,
    "from_user_id" UUID NOT NULL,
    "to_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folder_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "folder_shares_to_user_id_idx" ON "folder_shares"("to_user_id");

-- CreateIndex
CREATE INDEX "folder_shares_from_user_id_idx" ON "folder_shares"("from_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "folder_shares_folder_id_to_user_id_key" ON "folder_shares"("folder_id", "to_user_id");

-- AddForeignKey
ALTER TABLE "folder_shares" ADD CONSTRAINT "folder_shares_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_shares" ADD CONSTRAINT "folder_shares_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_shares" ADD CONSTRAINT "folder_shares_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
