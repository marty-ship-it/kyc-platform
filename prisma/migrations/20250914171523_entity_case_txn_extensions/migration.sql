/*
  Warnings:

  - You are about to drop the column `entity` on the `audit_events` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fullName" TEXT,
    "legalName" TEXT,
    "dob" DATETIME,
    "country" TEXT,
    "abnAcn" TEXT,
    "riskScore" TEXT NOT NULL DEFAULT 'LOW',
    "riskRationale" TEXT,
    "lastKycId" TEXT,
    "lastScreeningId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "entities_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "dealId" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cases_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cases_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cases_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EntityDeals" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EntityDeals_A_fkey" FOREIGN KEY ("A") REFERENCES "deals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EntityDeals_B_fkey" FOREIGN KEY ("B") REFERENCES "entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_audit_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL DEFAULT 'Deal',
    "entityId" TEXT,
    "caseId" TEXT,
    "action" TEXT NOT NULL,
    "payloadJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_events_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organisations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_audit_events" ("action", "createdAt", "entityId", "id", "orgId", "payloadJson", "userId") SELECT "action", "createdAt", "entityId", "id", "orgId", "payloadJson", "userId" FROM "audit_events";
DROP TABLE "audit_events";
ALTER TABLE "new_audit_events" RENAME TO "audit_events";
CREATE TABLE "new_evidence_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT,
    "partyId" TEXT,
    "caseId" TEXT,
    "kind" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evidence_files_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evidence_files_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evidence_files_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_evidence_files" ("createdAt", "dealId", "fileUrl", "id", "kind", "metadataJson", "partyId") SELECT "createdAt", "dealId", "fileUrl", "id", "kind", "metadataJson", "partyId" FROM "evidence_files";
DROP TABLE "evidence_files";
ALTER TABLE "new_evidence_files" RENAME TO "evidence_files";
CREATE TABLE "new_kyc_checks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT,
    "dvStatus" TEXT NOT NULL DEFAULT 'MANUAL',
    "liveness" BOOLEAN NOT NULL DEFAULT false,
    "proofOfAddressUrl" TEXT,
    "resultJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityId" TEXT,
    CONSTRAINT "kyc_checks_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "kyc_checks_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_kyc_checks" ("createdAt", "dvStatus", "id", "liveness", "partyId", "proofOfAddressUrl", "resultJson") SELECT "createdAt", "dvStatus", "id", "liveness", "partyId", "proofOfAddressUrl", "resultJson" FROM "kyc_checks";
DROP TABLE "kyc_checks";
ALTER TABLE "new_kyc_checks" RENAME TO "kyc_checks";
CREATE TABLE "new_parties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "entityId" TEXT,
    "type" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" DATETIME,
    "country" TEXT,
    "docType" TEXT,
    "docNumber" TEXT,
    "pepFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "parties_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parties_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_parties" ("country", "createdAt", "dealId", "dob", "docNumber", "docType", "fullName", "id", "pepFlag", "type") SELECT "country", "createdAt", "dealId", "dob", "docNumber", "docType", "fullName", "id", "pepFlag", "type" FROM "parties";
DROP TABLE "parties";
ALTER TABLE "new_parties" RENAME TO "parties";
CREATE TABLE "new_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "caseId" TEXT,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "pdfUrl" TEXT,
    "jsonUrl" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reports_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reports_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_reports" ("createdAt", "dealId", "id", "jsonUrl", "kind", "pdfUrl", "status", "submittedAt") SELECT "createdAt", "dealId", "id", "jsonUrl", "kind", "pdfUrl", "status", "submittedAt" FROM "reports";
DROP TABLE "reports";
ALTER TABLE "new_reports" RENAME TO "reports";
CREATE TABLE "new_screenings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT,
    "pep" BOOLEAN NOT NULL DEFAULT false,
    "sanctions" BOOLEAN NOT NULL DEFAULT false,
    "adverseMedia" BOOLEAN NOT NULL DEFAULT false,
    "resultJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityId" TEXT,
    CONSTRAINT "screenings_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "screenings_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_screenings" ("adverseMedia", "createdAt", "id", "partyId", "pep", "resultJson", "sanctions") SELECT "adverseMedia", "createdAt", "id", "partyId", "pep", "resultJson", "sanctions" FROM "screenings";
DROP TABLE "screenings";
ALTER TABLE "new_screenings" RENAME TO "screenings";
CREATE TABLE "new_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
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
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_transactions" ("amount", "counterparty", "createdAt", "currency", "dealId", "direction", "id", "isCrossBorder", "method", "receivedAt", "type") SELECT "amount", "counterparty", "createdAt", "currency", "dealId", "direction", "id", "isCrossBorder", "method", "receivedAt", "type" FROM "transactions";
DROP TABLE "transactions";
ALTER TABLE "new_transactions" RENAME TO "transactions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "entities_orgId_fullName_idx" ON "entities"("orgId", "fullName");

-- CreateIndex
CREATE INDEX "cases_orgId_entityId_status_idx" ON "cases"("orgId", "entityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "_EntityDeals_AB_unique" ON "_EntityDeals"("A", "B");

-- CreateIndex
CREATE INDEX "_EntityDeals_B_index" ON "_EntityDeals"("B");
