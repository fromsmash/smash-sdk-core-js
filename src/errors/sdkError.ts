export interface ResponseError {
    name: string;
    code?: number;
    error?: string;
    requestId?: string;
    details?: {
        name?: string;
        type?: string;
        reason?: string;
        expected?: string;
        given?: number;
        min?: number;
        max?: number;
        primary?: string;
        secondary?: string;
    }
}

export class SDKError extends Error {

    code?: number;
    error?: string;
    requestId?: string;
    details?: {
        name?: string;
        type?: string;
        reason?: string;
        expected?: string;
        given?: number;
        min?: number;
        max?: number;
        primary?: string;
        secondary?: string;
    }

    constructor(error: ResponseError | Error | string) {
        super();
        if (typeof error === 'string') {
            this.name = "SDKError";
            this.message = error;
        } else if (error instanceof Error) {
            this.name = error.name;
            this.message = error.message;
            this.stack = error.stack;
        } else if (error.name) {
            this.message = error.error as string;
            Object.assign(this, error);
            this.stack = SDKError.stringifiedStack();
        } else {
            this.name = 'Unknown SDK error';
            this.message = 'Unknown SDK error';
        }
    }

    static stack(): NodeJS.CallSite[] | string | undefined {
        if (Array.isArray(new Error().stack)) {
            const prepareStackTrace = Error.prepareStackTrace;
            Error.prepareStackTrace = (_, stack) => stack;
            const stack = ((new Error().stack) as unknown as NodeJS.CallSite[]).filter(s => !!s.getFileName());
            while ((stack[0].getFileName() as string).indexOf("sdkError") >= 0) {
                stack.shift();
            }
            while ((stack[0].getFileName() as string).indexOf("@smash-sdk") >= 0) {
                stack.shift();
            }
            Error.prepareStackTrace = prepareStackTrace;
            return stack;
        } else {
            return new Error().stack;
        }
    }

    static stringifiedStack(): string | undefined {
        if (Array.isArray(SDKError.stack())) {
            return (SDKError.stack() as NodeJS.CallSite[]).join("\n");
        } else {
            return new Error().stack;
        }
    }
}

export class UnknownError extends SDKError { }
export class NetworkError extends SDKError { }
export class TimeoutError extends SDKError { }
export class ConnectionAbortedError extends SDKError { }
export class InvalidSdkConfigurationError extends SDKError { }
export class InvalidRegionOrHostError extends InvalidSdkConfigurationError { }
export class InvalidRegionError extends InvalidRegionOrHostError { }
export class InvalidHostError extends InvalidRegionOrHostError { }
