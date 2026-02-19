# Disclosure Tier Framework

## Why This Framework Exists

During analysis of the EFTA corpus, it became apparent that the Department of Justice applied redactions improperly across a significant portion of scanned documents — black bars were drawn over content at the image level, but the underlying text layer was left intact. This is a government failure in document production, not a finding this project sought to create.

The immediate consequence is that names recoverable from under those redactions include not only public figures, financial institutions, and persons already known in connection with the case — but also victims. People who were harmed. People whose identities the DOJ intended to protect, and whose protection was compromised by inadequate redaction practices.

This framework was designed and implemented before any recovered content entered the reporting pipeline. Its purpose is to ensure that the financial analysis — the money, the institutions, the transaction patterns — can be published without causing further harm to the people this case was supposed to protect.

Every fragment defaults to WITHHELD until proven safe to disclose. The burden is on the data to demonstrate public nexus, not on the individual to request suppression.

## Purpose

The EFTA corpus contains redacted content that, when analyzed, may reveal names of victims, witnesses, cooperators, or other individuals whose identities were concealed for legitimate protective reasons. The disclosure tier framework ensures that recovered information is classified before it enters any deliverable, preventing inadvertent exposure of protected individuals.

## Tiers

### Tier 1 — PUBLISH

**Content:** Financial and institutional data only — dollar amounts, account references, institution names, transaction descriptions. No unvetted person names.

**Rule:** Fragment contains no person name entities, or person name fields are empty/null.

**Output:** Full recovered text displayed in all deliverables.

**Rationale:** Financial data is the primary analytical lane. Dollar amounts, bank names, and transaction types carry no victim identification risk.

### Tier 2 — CONDITIONAL

**Content:** Person names that are already publicly connected to the case through independent sources.

**Rule:** All person names in the fragment match the public-name whitelist. If some names match and others don't, the fragment is still Tier 2 but unknown names are replaced with `[NAME WITHHELD]` in the display text.

**Output:** Text displayed with public names visible and unknown names suppressed.

**Whitelist sources:**
- Names from DOJ public disclosures (flagged as known in POI rankings)
- Persons of interest with composite score ≥ 50 (appearing across multiple documents and datasets)
- High-frequency entities with 20+ corpus mentions (likely public figures, attorneys, or institutional representatives)

**Rationale:** If a name already appears in DOJ press releases, court filings, and multiple datasets, surfacing it in an analytical context adds no new exposure. The individual is already publicly associated with the case.

### Tier 3 — WITHHELD

**Content:** Person names with no public nexus to the case. These may be victims, witnesses, cooperating individuals, or other persons whose names were redacted for protective reasons.

**Rule:** No person names in the fragment match the public-name whitelist.

**Output:** All person names replaced with `[NAME WITHHELD]` in the display text. Raw data preserved in database but excluded from all deliverables and exports.

**Rationale:** The DOJ may have redacted these names to protect victims, minor witnesses, or individuals cooperating with investigations. Without independent confirmation of public status, the safe default is suppression.

## Implementation

### Database Columns

Two columns are added to the `redaction_recovery` table:

- `disclosure_tier` — TEXT: `PUBLISH`, `CONDITIONAL`, or `WITHHELD`
- `redacted_display` — TEXT: the recovered text with Tier 3 names replaced

### Pipeline Integration

Phase 7B runs after Phase 7 (recovery) and before Phase 5 (reporting). When Phase 5A loads recovered data for the POI pipeline, it filters:

```sql
WHERE COALESCE(disclosure_tier, 'WITHHELD') IN ('PUBLISH', 'CONDITIONAL')
```

Unclassified fragments (where `disclosure_tier` is NULL) default to WITHHELD — the most restrictive tier. This ensures that if Phase 7B has not been run, no recovered content leaks into deliverables.

### Name Replacement Logic

For Tier 3 fragments and mixed-name Tier 2 fragments, person names are detected via regex pattern matching (`[A-Z][a-z]+ [A-Z][a-z]+`) and replaced with `[NAME WITHHELD]`. The replacement operates on the display text only — the original `recovered_text` column is never modified.

## Authorized Access

The raw, unfiltered recovery data remains in the database for authorized review. This allows:

- Qualified researchers to request access under appropriate confidentiality terms
- Authorized investigators to review the full recovery without publication-layer filtering
- Future reclassification as more names become publicly associated with the case

The tier classification can be rerun at any time as the whitelist evolves. New DOJ disclosures, court filings, or media reporting may move names from Tier 3 to Tier 2.

## Design Principles

1. **Default restrictive** — unknown names are withheld, not published
2. **Financial focus** — the analytical lane is money movement, not individual identification
3. **Reversible** — tier assignments can be updated without modifying raw data
4. **Transparent** — every deliverable shows that content was withheld, not that it doesn't exist
5. **Separated concerns** — recovery (Phase 7) is independent from classification (Phase 7B) and reporting (Phase 5)
