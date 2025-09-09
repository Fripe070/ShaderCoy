import { LanguageSupport } from "@codemirror/language";
import { glslCompletion } from "./completions";
import { glslLanguage } from "./lang";

export function glsl() {
    return new LanguageSupport(glslLanguage, [glslCompletion]);
}
