export interface ResponseError {
    //TODO
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

    static stack(): NodeJS.CallSite[] {
        const prepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stack) => stack;
        const stack = (new Error().stack) as unknown as NodeJS.CallSite[];
        while ((stack[0].getFileName() as string).indexOf("sdkError") >= 0) {
            stack.shift();
        }
        while ((stack[0].getFileName() as string).indexOf("@smash-sdk") >= 0) {
            stack.shift();
        }
        Error.prepareStackTrace = prepareStackTrace;
        return stack;
    }

    static stringifiedStack(): string {
        return SDKError.stack().join("\n");
    }
}

export class UnknownError extends SDKError { }
export class NetworkError extends SDKError { }