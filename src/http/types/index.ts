import { RefreshTokenMethod } from "../../client/types";
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

export type HttpMethod = 'GET' | 'DELETE' | 'POST' | 'PUT' | 'PATCH';
export type HttpQueryParameters = { [key: string]: string | number | string[] | undefined };
export type HttpPathParameters = { [key: string]: string | number };
export type HttpHeaders = { [key: string]: string | number | string[] | undefined };
export type HttpBodyParameters = { [key: string]: any } | string | Buffer | ArrayBuffer;
export type HttpResponseType = 'stream' | 'object';

export interface UploadProgressEvent {
    uploadedBytes: number;
    totalBytes: number;
    timestamp: number;
}

export type HttpRequestParameters = HttpRequestUrlParameters | HttpRequestHostParameters;

export interface HttpRequestUrlParameters extends HttpRequestBaseParameters {
    url: string;
    method: HttpMethod;
}

export interface HttpRequestHostParameters extends HttpRequestBaseParameters {
    host: string;
    path: string;
    method: HttpMethod;
}

interface HttpRequestBaseParameters {
    headers?: HttpHeaders;
    queryParameters?: HttpQueryParameters;
    pathParameters?: HttpPathParameters;
    bodyParameters?: HttpBodyParameters;
    timeout?: number;
    bypassErrorHandler?: boolean;
    responseType?: HttpResponseType;
    onUploadProgress?: (event: UploadProgressEvent) => void;
    refreshTokenMethod?: RefreshTokenMethod;
}

export type HttpResponsesParameters<OutputBody> = {
    status: number;
    headers: HttpHeaders;
    body: OutputBody;
};

export interface HttpClientConfiguration {
    timeout?: number;
    httpAgent?: HttpAgent;
    httpsAgent?: HttpsAgent;
}

export interface HttpClient {
    setHttpConfiguration(configuration: HttpClientConfiguration): void
    handle<OutputBody>(request: HttpRequest, retries?: number): Promise<HttpResponse<OutputBody>>;
}


export class HttpRequest {
    public method: HttpMethod;
    public host?: string;
    public path?: string;
    public url?: string;
    public headers: HttpHeaders = {};
    public pathParameters: HttpPathParameters = {};
    public queryParameters: HttpQueryParameters = {};
    public bodyParameters?: HttpBodyParameters;
    public timeout?: number;
    public bypassErrorHandler?: boolean = false;
    public responseType?: HttpResponseType = 'object';
    public onUploadProgress?: (event: UploadProgressEvent) => void;
    public refreshTokenMethod?: RefreshTokenMethod;


    constructor(params: HttpRequestParameters) {
        this.method = params.method;
        if ((params as HttpRequestHostParameters).host) {
            this.host = (params as HttpRequestHostParameters).host;
        }
        if ((params as HttpRequestHostParameters).path) {
            this.path = this.processPath((params as HttpRequestHostParameters).path, params.pathParameters);
        }
        if ((params as HttpRequestUrlParameters).url) {
            this.url = (params as HttpRequestUrlParameters).url;
        }
        if (params.headers) {
            this.headers = params.headers;
        }
        if (params.pathParameters) {
            this.pathParameters = params.pathParameters;
        }
        if (params.queryParameters) {
            this.queryParameters = params.queryParameters;
        }
        this.bodyParameters = params.bodyParameters;
        this.timeout = params.timeout;
        this.bypassErrorHandler = params.bypassErrorHandler;
        if (params.responseType) {
            this.responseType = params.responseType;
        }
        if (params.onUploadProgress) {
            this.onUploadProgress = params.onUploadProgress;
        }
        if (params.refreshTokenMethod) {
            this.refreshTokenMethod = params.refreshTokenMethod;
        }
    }

    private processPath(path: string = "/", pathParameters: HttpPathParameters = {}): string {
        path = path.charAt(0) !== "/" ? `/${path}` : path;
        if (pathParameters) {
            Object.keys(pathParameters).map((key: string) => {
                path = path.replace(':' + key, encodeURIComponent(pathParameters[key] as string));
            });
        }
        return path;
    }

    getUrl(): string {
        if (this.host) {
            return `${this.host}${this.path}` as string;
        } else {
            return this.url as string;
        }
    }
}


export class HttpResponse<OutputBody> {
    public statusCode: number;
    public headers: HttpHeaders;
    public body?: OutputBody;

    constructor(params: HttpResponsesParameters<OutputBody>) {
        this.statusCode = params.status;
        this.headers = params.headers || {};
        this.body = params.body;
    }
}