import appState from "@/scripts/state";
import { Compartment, StateEffect, type Extension } from "@codemirror/state";
import { EditorView } from "codemirror";

export const editorCompartments = {
    theme: new Compartment(),
    wrapLines: new Compartment(),
};

export function updateCompartment(
    compartmentname: keyof typeof editorCompartments,
    extension: Extension,
): StateEffect<unknown> {
    const effect = editorCompartments[compartmentname].reconfigure(extension);
    Object.values(appState.editorViews).forEach((view: EditorView) => {
        view.dispatch({ effects: effect });
    });
    return effect;
}
