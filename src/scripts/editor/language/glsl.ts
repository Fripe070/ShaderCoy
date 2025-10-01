import { glslCompletion } from "./completions";
import { glslLanguage } from "./lang";
import { LanguageSupport } from "@codemirror/language";

export function glsl() {
    return new LanguageSupport(glslLanguage, [glslCompletion]);
}
