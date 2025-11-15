import { describe, it, expect } from "vitest";
import { parser } from "../lib/editor/glsl/parser.js";

describe("glsl parsing", () => {
	console.log(parser.parse("1 !"));
	it("parses a simple expression", () => {
		expect(parser.parse("1 + 2")).toMatchSnapshot();
	});
});
