import type { ErrorReporter, OpenGLCanvas } from "./rendering/OpenGLCanvas";

export type ApplicationState = {
    openGLCanvas: OpenGLCanvas | null;
    errorReporter: ErrorReporter | null;
};

const applicationState: ApplicationState = {
    openGLCanvas: null,
    errorReporter: null,
};
export default applicationState;
