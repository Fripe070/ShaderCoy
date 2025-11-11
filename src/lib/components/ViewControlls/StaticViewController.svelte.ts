import { mat4 } from "gl-matrix";
import { ViewController } from "./ViewController.js";

export default class StaticViewController extends ViewController {
	getMatrix(): mat4 {
		return mat4.create();
	}
}
