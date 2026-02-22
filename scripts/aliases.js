// scripts/aliases.js
// Canonical entity name resolution map
// Key = canonical display name (used as node ID in graph)
// Values = all raw name variants from the dataset that map to this canonical name

export const ALIAS_MAP = {
    // Jeffrey Epstein + his accounts
    "Jeffrey Epstein": [
        "Jeffrey Epstein NOW/SuperNow Account",
        "JEFFERY EPSTEIN",
        "JEFFREY -",
        "MR EPSTEIN",
        "E STEIN",
        "EPSTEIN & CO",
    ],

    // Leon Black
    "Leon Black": [
        "Leon & Debra Black",
        "Leon & Debra Black c/o Apollo Management",
        "LEON_BLACK",
        "DEBRA_BLACK",
        "DEBRA R. BLACK",
    ],

    // Black Family entities
    "Black Family Partners": [
        "Black Family Partners LP c/o Apollo Management",
        "Black Family Partners LP",
    ],

    // Southern Trust
    "Southern Trust Company": [
        "Southern Trust Company Inc.",
        "SOUTHERN_TRUST",
    ],

    // Southern Financial
    "Southern Financial": [
        "Southern Financial LLC",
        "SOUTHERN_FINANCIAL",
    ],

    // Gratitude America
    "Gratitude America": [
        "Gratitude America MMDA",
        "Gratitude America Ltd. (First Bank PR)",
        "Gratitude America Ltd. (Morgan Stanley/Citibank)",
        "GRATITUDE_AMERICA",
    ],

    // Deutsche Bank
    "Deutsche Bank": [
        "DEUTSCHE",
    ],

    // Haze Trust
    "The Haze Trust": [
        "The Haze Trust (DBAGNY)",
        "HAZE_TRUST",
    ],

    // Joichi Ito
    "Joichi Ito": [
        "Joichi Ito",
        "ITO",
    ],

    // Darren Indyke (Epstein's lawyer)
    "Darren Indyke": [
        "INDYKE",
    ],

    // JP Morgan
    "JPMorgan": [
        "JPMORGAN",
    ],

    // BNY Mellon
    "BNY Mellon": [
        "BNY_MELLON",
    ],

    // Citibank
    "Citibank": [
        "CITIBANK",
    ],

    // Ghislaine Maxwell
    "Ghislaine Maxwell": [
        "MAXWELL",
    ],

    // Financial Trust
    "Financial Trust": [
        "FINANCIAL_TRUST",
    ],

    // Butterfly Trust
    "Butterfly Trust": [
        "BUTTERFLY_TRUST",
    ],

    // Jeepers Inc (these are intentionally separate — DB Brokerage is a sub-account)
    // Keeping as-is per user decision that each unique name = considered unique
    // EXCEPT for clear same-entity cross-tier duplicates above

    // Narrow Holdings / Elysium Management
    "Narrow Holdings": [
        "Narrow Holdings LLC c/o Elysium Management",
    ],
};

// Build reverse lookup: rawName -> canonicalName
export function buildReverseMap(aliasMap) {
    const reverse = {};
    for (const [canonical, variants] of Object.entries(aliasMap)) {
        for (const variant of variants) {
            reverse[variant] = canonical;
        }
    }
    return reverse;
}

// Resolve a raw entity name to its canonical form
export function resolveEntity(rawName, reverseMap) {
    return reverseMap[rawName] ?? rawName;
}
