-- AlterTable
ALTER TABLE "cases" ADD COLUMN "signals" JSONB;

-- AlterTable
ALTER TABLE "entities" ADD COLUMN "aliases" JSONB;
ALTER TABLE "entities" ADD COLUMN "masterNotes" JSONB;

-- CreateTable
CREATE TABLE "org_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeDocuments" BOOLEAN NOT NULL DEFAULT true,
    "kycReuseMonths" INTEGER NOT NULL DEFAULT 12
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_kyc_checks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT,
    "dvStatus" TEXT NOT NULL DEFAULT 'MANUAL',
    "liveness" BOOLEAN NOT NULL DEFAULT false,
    "proofOfAddressUrl" TEXT,
    "docType" TEXT,
    "docNumber" TEXT,
    "issuer" TEXT,
    "expiry" DATETIME,
    "verifiedElsewhere" BOOLEAN NOT NULL DEFAULT false,
    "verificationHash" TEXT,
    "resultJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityId" TEXT,
    CONSTRAINT "kyc_checks_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "kyc_checks_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_kyc_checks" ("createdAt", "dvStatus", "entityId", "id", "liveness", "partyId", "proofOfAddressUrl", "resultJson") SELECT "createdAt", "dvStatus", "entityId", "id", "liveness", "partyId", "proofOfAddressUrl", "resultJson" FROM "kyc_checks";
DROP TABLE "kyc_checks";
ALTER TABLE "new_kyc_checks" RENAME TO "kyc_checks";
CREATE TABLE "new_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT,
    "entityId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'DEPOSIT',
    "subtype" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "direction" TEXT NOT NULL,
    "counterparty" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "purpose" TEXT,
    "isCrossBorder" BOOLEAN NOT NULL DEFAULT false,
    "isStructured" BOOLEAN NOT NULL DEFAULT false,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "overseasAccount" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_transactions" ("amount", "counterparty", "createdAt", "currency", "dealId", "direction", "flagged", "id", "isCrossBorder", "isInternal", "isStructured", "method", "purpose", "receivedAt", "subtype", "type") SELECT "amount", "counterparty", "createdAt", "currency", "dealId", "direction", "flagged", "id", "isCrossBorder", "isInternal", "isStructured", "method", "purpose", "receivedAt", "subtype", "type" FROM "transactions";
DROP TABLE "transactions";
ALTER TABLE "new_transactions" RENAME TO "transactions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
