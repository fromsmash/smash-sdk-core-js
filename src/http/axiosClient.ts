import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { RefreshTokenMethod } from '../client/types';
import { NetworkError, UnknownError } from '../errors/sdkError';
import { HttpClient, HttpRequest, HttpResponse, UploadProgressEvent } from './types';
import { XMLParser } from "fast-xml-parser";

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
        this.client = axios.create(defaultAxiosConfig)
    }

    handle<OutputBody>(request: HttpRequest, retries: number = 0): Promise<HttpResponse<OutputBody>> {
        return new Promise(async (resolve, reject) => {
            try {
                const axiosParams = this.transformToAxiosParams(request);
                const response = await this.client.request(axiosParams);
                const smashResponse: HttpResponse<OutputBody> = this.transformToSmashResponse<OutputBody>(response);
                resolve(smashResponse);
            } catch (error: unknown) {
                if (!(error as AxiosError)?.response && (error as AxiosError)?.request) {
                    reject(new NetworkError(error as AxiosError));
                } else if (request.bypassErrorHandler && error instanceof AxiosError && error?.response) {
                    const smashResponse: HttpResponse<OutputBody> = this.transformToSmashResponse<OutputBody>((error as AxiosError).response as AxiosResponse<OutputBody>);
                    resolve(smashResponse);
                } else if ((error as AxiosError)?.response?.status) {
                    const smashResponse: HttpResponse<OutputBody> = this.transformToSmashResponse<OutputBody>((error as AxiosError).response as AxiosResponse<OutputBody>);
                    if (smashResponse.statusCode === 401 && request.refreshTokenMethod) {
                        try {
                            const token = await request.refreshTokenMethod(smashResponse, retries);
                            if (token) {
                                const newRequest = request;
                                newRequest.headers = { ...request.headers, Authorization: 'Bearer ' + token }
                                const newResponse = await this.handle<OutputBody>(newRequest, ++retries);
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
            headers: request.headers,
            data: request.bodyParameters,
            params: request.queryParameters,
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


