import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse } from 'axios';
import { RefreshTokenMethod } from '../client/types';
import { ConnectionAbortedError, NetworkError, ResponseError, TimeoutError, UnknownError } from '../errors/sdkError';
import { HttpClient, HttpClientConfiguration, HttpRequest, HttpResponse, UploadProgressEvent } from './types';
import { XMLParser } from "fast-xml-parser";
import Qs from "qs";
interface AxiosUploadProgressEvent {
    loaded: number,
    total: number,
    timeStamp: number,
};

const defaultAxiosConfig: AxiosRequestConfig = {
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    responseType: 'json',
};

export class AxiosClient implements HttpClient {

    client: AxiosInstance;
    refreshTokenMethod?: RefreshTokenMethod;


    constructor() {
        this.client = axios.create(defaultAxiosConfig);
    }

    setHttpConfiguration(configuration: HttpClientConfiguration): void {
        this.client = axios.create({ ...defaultAxiosConfig, ...configuration });
    }

    handle<OutputBody>(request: HttpRequest): Promise<HttpResponse<OutputBody>> {
        return new Promise(async (resolve, reject) => {
            try {
                const axiosParams = this.transformToAxiosParams(request);
                const response = await this.client.request(axiosParams);
                const smashResponse: HttpResponse<OutputBody> = this.transformToSmashResponse<OutputBody>(response);
                resolve(smashResponse);
            } catch (error: unknown) {
                if ((error as AxiosError)?.code === AxiosError.ERR_NETWORK) {
                    reject(new NetworkError(error as AxiosError));
                } else if ((error as AxiosError)?.code === AxiosError.ECONNABORTED) {
                    reject(new ConnectionAbortedError(error as AxiosError));
                } else if ((error as AxiosError)?.code === AxiosError.ETIMEDOUT) {
                    reject(new TimeoutError(error as AxiosError));
                } else if ((!(error as AxiosError)?.response && (error as AxiosError)?.request)) {
                    reject(new NetworkError(error as AxiosError));
                } else if ((error as AxiosError)?.response?.status || (request.bypassErrorHandler && error instanceof AxiosError && error?.response)) {
                    const smashResponse: HttpResponse<OutputBody> = this.transformToSmashResponse<OutputBody>((error as AxiosError).response as AxiosResponse<OutputBody>);
                    resolve(smashResponse);
                } else {
                    reject(new UnknownError(error as Error));
                }
            }
        })
    };

    transformToSmashResponse<OutputBody>(response: AxiosResponse<OutputBody>): HttpResponse<OutputBody> {
        if (response?.headers?.['content-type'] === 'application/xml' && typeof response?.data === 'string') {
            const parser = new XMLParser();
            response.data = parser.parse(response.data as string) as OutputBody;
        }
        return new HttpResponse<OutputBody>({ ...response, body: response.data });
    }

    transformToAxiosParams(request: HttpRequest): AxiosRequestConfig {
        return {
            method: request.method.toLowerCase(),
            url: request.getUrl(),
            headers: request.headers as AxiosRequestHeaders,
            data: request.bodyParameters,
            params: request.queryParameters,
            paramsSerializer: (params) => Qs.stringify(params, { arrayFormat: 'repeat' }),
            responseType: request.responseType === 'object' ? 'json' : 'stream',
            onUploadProgress: (event: AxiosUploadProgressEvent) => {
                if (request.onUploadProgress) {
                    const parsedEvent: UploadProgressEvent = {
                        uploadedBytes: event.loaded,
                        totalBytes: event.total,
                        timestamp: event.timeStamp,
                    };
                    request.onUploadProgress(parsedEvent);
                }
            },
        };
    }
}


