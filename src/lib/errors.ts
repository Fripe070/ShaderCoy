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
		// We need to flatten it so that we can get an actual message in our error output
		const errorMessage =
			`${message}\n` +
			reports
				.map(
					(report, index) =>
						`Error #${index + 1} caused by: ${report.cause}\n${report.description}`,
				)
				.join("\n");
		super(errorMessage);
	}
}
