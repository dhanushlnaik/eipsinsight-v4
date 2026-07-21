-- EIPs referenced in ethereum/pm ACD agenda issues (body + comments).
-- Written by the scheduler, read by /board's ACD Agenda tab.
CREATE TABLE IF NOT EXISTS "pm_agenda_eips" (
    "id"           SERIAL PRIMARY KEY,
    "issue_number" INTEGER NOT NULL,
    "eip_number"   INTEGER NOT NULL,
    "series"       TEXT,
    "call_number"  TEXT,
    "issue_title"  TEXT,
    "issue_url"    TEXT,
    "issue_state"  TEXT,
    "occurs_on"    DATE,
    "source"       TEXT NOT NULL,
    "mentioned_by" TEXT NOT NULL DEFAULT '',
    "snippet"      TEXT,
    "source_url"   TEXT,
    "mentioned_at" TIMESTAMPTZ(6),
    "created_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One row per (issue, eip, source, author): the same EIP can legitimately be
-- raised by different people on the same agenda, and each mention carries its
-- own quote. mentioned_by is NOT NULL DEFAULT '' so it participates in the key —
-- NULLs never conflict in Postgres and would duplicate on every scheduler cycle.
CREATE UNIQUE INDEX IF NOT EXISTS "pm_agenda_eips_unique"
    ON "pm_agenda_eips" ("issue_number", "eip_number", "source", "mentioned_by");

CREATE INDEX IF NOT EXISTS "pm_agenda_eips_eip_number_idx" ON "pm_agenda_eips" ("eip_number");
CREATE INDEX IF NOT EXISTS "pm_agenda_eips_series_idx"     ON "pm_agenda_eips" ("series");
CREATE INDEX IF NOT EXISTS "pm_agenda_eips_occurs_on_idx"  ON "pm_agenda_eips" ("occurs_on");
