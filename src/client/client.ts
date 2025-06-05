import { config } from '../config/config';
import { InvalidHostError, InvalidRegionError, InvalidRegionOrHostError, ResponseError, SDKError, UnknownError } from '../errors/sdkError';
import { formatErrorName } from '../helper/error';
import { isNode } from '../helper/node';
import { RefreshTokenManager } from '../helper/refreshTokenManager';
import { AxiosClient, HttpClient, HttpHeaders, HttpQueryParameters, HttpRequest, HttpResponse } from '../http';
import { ClientParameters, Global, RefreshTokenMethod, Region, ServiceType } from './types';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

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
        this.client.setHttpConfiguration({
            timeout: this.getTimeout(params),
            httpAgent: params.httpAgent,
            httpsAgent: params.httpsAgent,
        });
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

    getTimeout(params: ClientParameters): number | undefined {
        if (params.timeout) {
            return params.timeout;
        }
        const timeout = config.getTimeout();
        if (timeout) {
            return timeout;
        }
        return undefined;
    }

    getHttpAgent(params: ClientParameters): HttpAgent | undefined {
        if (params.httpAgent) {
            return params.httpAgent;
        }
        const httpAgent = config.getHttpAgent();
        if (httpAgent) {
            return httpAgent;
        }
        return undefined;
    }

    getHttpsAgent(params: ClientParameters): HttpsAgent | undefined {
        if (params.httpsAgent) {
            return params.httpsAgent;
        }
        const httpsAgent = config.getHttpsAgent();
        if (httpsAgent) {
            return httpsAgent;
        }
        return undefined;
    }

    handle<T>(request: HttpRequest, retries: number = 0): Promise<HttpResponse<T>> {
        return new Promise(async (resolve, reject) => {
            if (isNode()) {
                request.headers['User-Agent'] = this.userAgent;
            }
            request = this.cleanRequest(request);
            try {
                const smashResponse = await this.client.handle<T>(request);
                if (smashResponse.statusCode === 401 && typeof request.refreshTokenMethod === 'function') {
                    try {
                        const token = await request.refreshTokenMethod(smashResponse as HttpResponse<ResponseError>, retries);
                        if (token) {
                            this.token = token;
                            const newRequest = request;
                            newRequest.headers = { ...request.headers, Authorization: 'Bearer ' + this.token };
                            const newResponse = await this.handle<T>(newRequest, ++retries);
                            resolve(newResponse);
                        } else {
                            resolve(smashResponse);
                        }
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    resolve(smashResponse);
                }
            } catch (error: unknown) {
                reject(error);
            }
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

    protected clean(data: HttpHeaders | HttpQueryParameters): HttpHeaders | HttpQueryParameters {
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        return data;
    }

    protected cleanRequest(request: HttpRequest): HttpRequest {
        request.headers = this.clean(request.headers);
        request.queryParameters = this.clean(request.queryParameters);
        return request;
    }
}
