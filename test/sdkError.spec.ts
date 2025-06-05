import { SDKError } from '../src/errors/sdkError'
import { ResponseError } from '../src/errors/sdkError'

describe('SdkError', () => {
    it('SDK Error string Test', () => {
        const error = new SDKError("This is a string error");
        expect(error.name).toBe("SDKError");
        expect(error.message).toBe("This is a string error");
    });

    it('SDK Error native Test', () => {
        const nativeError = new Error("This is a native error");
        const error = new SDKError(nativeError);
        expect(error.name).toBe(nativeError.name);
        expect(error.message).toBe(nativeError.message);
        expect(error.stack).toBe(nativeError.stack);
    });

    it('SDK Error ResponseError Test #1', () => {
        const responseError: ResponseError = { name: "NotFoundError", code: 404, error: "Resource Not Found", requestId: "aaaaaaaaa-bbbbbbbbbbb-cccccccccccccc-dddddddd" };
        const error = new SDKError(responseError);
        expect(error.name).toBe(responseError.name);
        expect(error.message).toBe(responseError.error);
        expect(error.code).toBe(responseError.code);
        expect(error.requestId).toBe(responseError.requestId);
        //expect(error.stack).toBe(responseError.stack);
    });

    it('SDK Error ResponseError Test #2', () => {
        const responseError: ResponseError = { name: "NotFoundError", code: 404, error: "Resource Not Found", requestId: "aaaaaaaaa-bbbbbbbbbbb-cccccccccccccc-dddddddd", details: { primary: "Resource" } };
        const error = new SDKError(responseError);
        expect(error.name).toBe(responseError.name);
        expect(error.message).toBe(responseError.error);
        expect(error.code).toBe(responseError.code);
        expect(error.requestId).toBe(responseError.requestId);
        expect(error.details).toBe(responseError.details);
        //expect(error.stack).toBe(responseError.stack);//FIX ME 
    });
});