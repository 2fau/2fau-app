// Derive the Firefox manifest from the Chrome one so the two never drift.
// Differences that matter for Gecko:
//  - background: an event page (`scripts`) with a DOM, not a DOM-less service
//    worker — this is also what lets clipboard copy work without `offscreen`.
//  - browser_specific_settings.gecko.id: required for signing / AMO.
//  - drop the `offscreen` permission (Chrome-only; unknown to Firefox).
//  - options_page -> options_ui (Firefox's spelling).

/** Firefox add-on id. Replace with your AMO id before publishing. */
export const GECKO_ID = "2fau@artkost.dev";

/** Minimum Firefox: MV3 + module background scripts + storage.session (121),
 * and `optional_host_permissions` for the desktop bridge (128). */
export const MIN_FIREFOX = "128.0";

/** Transform a Chrome MV3 manifest object into a Firefox one. Pure. */
export function toFirefoxManifest(chrome) {
  const firefox = structuredClone(chrome);

  firefox.background = { scripts: ["background.js"], type: "module" };

  firefox.browser_specific_settings = {
    gecko: { id: GECKO_ID, strict_min_version: MIN_FIREFOX },
  };

  if (Array.isArray(firefox.permissions)) {
    firefox.permissions = firefox.permissions.filter((p) => p !== "offscreen");
  }

  if (firefox.options_page) {
    firefox.options_ui = { page: firefox.options_page, open_in_tab: true };
    delete firefox.options_page;
  }

  return firefox;
}
