import { MediaQuery } from "svelte/reactivity";

const smallQuery = new MediaQuery("max-width: 48rem"); // Tailwind 'md'
export const isSmallScreen = () => smallQuery.current;

export function deepFreeze<T>(obj: T): Readonly<T> {
	Object.getOwnPropertyNames(obj).forEach((prop) => {
		const value = obj[prop as keyof T];
		if (value && typeof value === "object") {
			deepFreeze(value);
		}
	});
	return Object.freeze(obj);
}

export function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj)) as T;
}

export function noUnhandledCase(_case: never): never {
	throw new Error(`Unhandled case: ${_case}`);
}

export function canUseLocalStorage(): boolean {
	// If embedded in an iframe we might not have access localStorage
	try {
		return window.localStorage !== undefined;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (error) {
		return false;
	}
}
