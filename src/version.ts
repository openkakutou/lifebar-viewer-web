// Read straight from package.json's own "version" field (never a separate
// literal) so the two can never drift apart again -- see
// .vibe/decisions/008-app-version-read-via-resolvejsonmodule-import.md.
// Only the `version` named export is imported, not the whole object, so
// the rest of package.json's contents never end up in the shipped bundle.
import { version } from "../package.json" with { type: "json" };

export const appVersion: string = version;
