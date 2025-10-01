import { Compartment, type Extension } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";

const SELECTOR_PREFERS_DARK_COLOR_SCHEME = "(prefers-color-scheme: dark)";

function autoColorScheme(
    options: {
        dark?: Extension;
        light?: Extension;
        defaultDark?: boolean;
    } = {},
): Extension {
    const { dark: darkExt = [], light: lightExt = [], defaultDark = false } = options;

    const darkThemeCompartment = new Compartment();

    function darkThemeExt(dark: boolean): Extension {
        return dark ? darkExt : lightExt;
    }

    const plugin = ViewPlugin.define((view) => {
        function colorSchemeChangeHandler(evt: MediaQueryListEvent) {
            dispatchDarkTheme(evt.matches);
        }

        function dispatchDarkTheme(dark: boolean) {
            view.dispatch({
                effects: darkThemeCompartment.reconfigure(darkThemeExt(dark)),
            });
        }

        const win = view.dom.ownerDocument.defaultView;
        const supportsMatchMedia = typeof win?.matchMedia === "function";

        if (supportsMatchMedia) {
            const query = win.matchMedia(SELECTOR_PREFERS_DARK_COLOR_SCHEME);
            query.addEventListener("change", colorSchemeChangeHandler);
            if (query.matches !== defaultDark) {
                dispatchDarkTheme(query.matches);
            }
            return {
                destroy() {
                    query.removeEventListener("change", colorSchemeChangeHandler);
                },
            };
        }

        // matchMedia is unsupported?
        return {};
    });

    return [plugin, darkThemeCompartment.of(darkThemeExt(defaultDark))];
}
