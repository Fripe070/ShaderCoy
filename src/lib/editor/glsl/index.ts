import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { parser } from "./glsl.grammar";

const glsl = () => {
	return new LanguageSupport(
		LRLanguage.define({
			parser: parser.configure({}),
		}),
		[]
	);
};
export default glsl;
