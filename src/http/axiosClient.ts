import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { RefreshTokenMethod } from '../client/types';
import { NetworkError, SDKError, UnknownError } from '../errors/sdkError';
import constant from '../global/constant';
// import axiosRetry from 'axios-retry';
import { HttpClient, HttpRequest, HttpResponse, UploadProgressEvent } from './types';

interface AxiosUploadProgressEvent {
    loaded: number,
    total: number,
    timeStamp: number,
};

export class AxiosClient<T = any> implements HttpClient {

    client: AxiosInstance;
    refreshTokenMethod?: RefreshTokenMethod;
    //public retries: number = 3;// FIX ME 

    constructor() {
        this.client = axios.create(constant.AXIOS_CLIENT_DEFAULT_CONFIG)
        // retries
        /*   axiosRetry(this.client, {//FIX ME 
              retries: params.retries || this.retries,
              retryDelay: axiosRetry.exponentialDelay
          }); */
        /*         this.client.interceptors.response.use((response) => response, (error) => {
                    if (!error?.response?.body) {
                        error.response.body = {};
                    }
                    // console.log('ERROR MSG', error.response?.data);
                    error.response.body = error.response.data;
                    error.response.body.name = error.response?.data?.name || 'NotFound';//FIX ME why NotFound // temp waiting for api to set name on errors            
        
                    delete error.response.data;
                    return Promise.reject(error);
                }); */
    }

    handle<OutputBody>(request: HttpRequest, retries: number = 0): Promise<HttpResponse<OutputBody>> {
        return new Promise(async (resolve, reject) => {
            try {
                const axiosParams = this.transformToAxiosParams(request);
                const response = await this.client.request(axiosParams);
                const smashResponse: HttpResponse<OutputBody> = this.transformToSmashResponse(response);
                resolve(smashResponse);
            } catch (error: unknown) {
                if (!(error as AxiosError)?.response && (error as AxiosError)?.request) {
                    reject(new NetworkError(error as AxiosError));
                } else if (request.bypassErrorHandler && error instanceof AxiosError && error?.response) {
                    const smashResponse: HttpResponse<OutputBody> = this.transformToSmashResponse((error as AxiosError).response as AxiosResponse<OutputBody>);
                    resolve(smashResponse);
                } else if ((error as AxiosError)?.response?.status) {
                    const smashResponse: HttpResponse<OutputBody> = this.transformToSmashResponse((error as AxiosError).response as AxiosResponse<OutputBody>);
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
        return new HttpResponse({ ...response, body: response.data });
    }

    transformToAxiosParams(request: HttpRequest): AxiosRequestConfig {
        return {
            method: request.method.toLowerCase(),
            url: request.getUrl(),
            headers: request.headers,
            data: request.bodyParameters,
            params: request.queryParameters,
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

    destroy() {
        // delete this.client;
    }
}


