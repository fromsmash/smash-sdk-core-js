import { config } from '../config/config';
import { InvalidHostError, InvalidRegionError, InvalidRegionOrHostError, ResponseError, SDKError, UnknownError } from '../errors/sdkError';
import { formatErrorName } from '../helper/error';
import { isNode } from '../helper/node';
import { RefreshTokenManager } from '../helper/refreshTokenManager';
import { AxiosClient, HttpClient, HttpHeaders, HttpRequest, HttpResponse } from '../http';
import { ClientParameters, Global, RefreshTokenMethod, Region, ServiceType } from './types';

export class Client {
    public service: string;
    public token?: string;
    public client: HttpClient;
    public region?: Region | Global;
    public host: string;
    public userAgent: string;
    public refreshTokenMethod?: RefreshTokenMethod;
    public refreshTokenManager?: RefreshTokenManager;

    constructor(params: ClientParameters & { service: string, type: ServiceType, userAgent: string }) {
        this.service = params.service;
        this.client = params.client || new AxiosClient();
        this.token = params.token ? params.token : config.getToken();
        this.region = this.getRegion(params);
        this.host = this.getHost(params);
        this.userAgent = params.userAgent;
        if (params.refreshTokenMethod) {
            this.refreshTokenManager = new RefreshTokenManager(params.refreshTokenMethod);
            this.refreshTokenMethod = this.refreshTokenManager.getRefreshTokenMethod();
        } else if (config.getRefreshTokenMethod() && config.getRefreshTokenManager() !== undefined) {
            this.refreshTokenManager = config.getRefreshTokenManager();
            this.refreshTokenMethod = this.refreshTokenManager?.getRefreshTokenMethod();
        }
    }

    getRegion(params: ClientParameters & { type: ServiceType }): Region | Global | undefined {
        const region = config.getRegion();
        if (params.type === 'global' && params.region) {
            throw new InvalidRegionError('Invalid region: region ' + params.region + ' provided in constructor not available');
        }
        if (!params.host && params.type === 'regional' && !params.region && !region) {
            throw new InvalidRegionOrHostError('Invalid region or host: no host or no region provided in constructor and no region configured in config');
        }
        if (params.type === 'global') {
            return 'global';
        }
        if (params.region && params.type === 'regional') {
            return params.region;
        }
        if (region && params.type === 'regional') {
            return region;
        }
        if (!params.host) {
            throw new InvalidRegionError('Invalid region: no region provided in constructor and no region configured in config');
        }
    }

    getHost(params: ClientParameters): string {
        if (params.host) {
            return params.host;
        }
        const host = config.getHost(this.service, this.region);
        if (host) {
            return host;
        }
        throw new InvalidHostError('Invalid host: no host provided in constructor and no host configured in config');
    }

    handle<T>(request: HttpRequest): Promise<HttpResponse<T>> {
        return new Promise((resolve, reject) => {
            if (!request.headers) {
                request.headers = {};
            }
            if (isNode()) {
                request.headers['User-Agent'] = this.userAgent;
            }
            request.headers = this.cleanHeaders(request.headers);
            this.client.handle<T>(request).then(resolve).catch(reject);
        });
    }

    parseResponse<ResponseBody, OutputBody>(response: HttpResponse<ResponseBody | ResponseError>, errors: { [key: string]: typeof SDKError }): OutputBody {
        if (this.isValidStatusCode(response.statusCode)) {
            return response.body ? response.body as unknown as OutputBody : {} as unknown as OutputBody;
        } else if ((response?.body as ResponseError)?.name && errors[formatErrorName((response?.body as ResponseError).name)]) {
            const body = response?.body as ResponseError;
            const error = new errors[formatErrorName((response?.body as ResponseError).name)](body);
            throw error;
        } else {
            throw new UnknownError((response?.body as ResponseError));
        }
    }

    isValidStatusCode(code: number): boolean {
        return code >= 200 && code < 300;
    }

    cleanHeaders(headers: HttpHeaders): HttpHeaders {
        Object.keys(headers).forEach(key => headers[key] === undefined && delete headers[key]);
        return headers;
    }
}
