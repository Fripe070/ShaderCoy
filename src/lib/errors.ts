export class CoyErrorReport {
	constructor(
		public cause: string,
		public description: string,
	) {}
}

export interface CoyErrorLogs {
	shaderErrors: CoyErrorReport[];
}
export function hasErrors(logs: CoyErrorLogs): boolean {
	return Object.values(logs).some((arr) => arr.length > 0);
}

export class CoyReportedError extends Error {
	constructor(
		message: string,
		public reports: CoyErrorReport[],
	) {
		super(message);
	}
}
