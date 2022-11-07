import { config } from "../config/config";
import { ResponseError, SDKError, UnknownError } from "../errors/sdkError";
import { AxiosClient, HttpClient, HttpResponse } from "../http";
import { ClientParameters, Global, RefreshTokenMethod, Region } from "./types";


export class Client {
    public service: string;
    public token?: string;
    public client: HttpClient;
    public region?: Region | Global;
    public host?: string;
    public refreshTokenMethod?: RefreshTokenMethod;

    constructor(params: ClientParameters & { service: string }) {
        this.service = params.service;
        this.client = params.client || new AxiosClient();
        this.token = params.token ? params.token : config.getToken();
        this.region = params.region ? params.region : config.getRegion();
        this.host = params.host ? params.host : config.getHost(this.service, this.region);
        if (params.refreshTokenMethod) {
            this.refreshTokenMethod = this.buildRefreshTokenMethod(params.refreshTokenMethod);
        }
    }

    parseResponse<ResponseBody, OutputBody>(response: HttpResponse<ResponseBody | ResponseError>, errors: { [key: string]: typeof SDKError }): OutputBody {
        if (this.isValidStatusCode(response.statusCode)) {
            return response.body ? response.body as unknown as OutputBody : {} as unknown as OutputBody;
        } else if ((response?.body as ResponseError)?.name && errors[(response?.body as ResponseError).name]) {
            const body = response?.body as ResponseError;
            const error = new errors[(response?.body as ResponseError).name](body);
            throw error;
        } else {
            throw new UnknownError((response?.body as ResponseError));
        }
    }

    isValidStatusCode(code: number): boolean {
        return code >= 200 && code < 300;
    }

    buildRefreshTokenMethod(refreshTokenMethod: RefreshTokenMethod): RefreshTokenMethod {
        return (error: HttpResponse<any>, retries: number = 0) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const token = await refreshTokenMethod(error, retries);
                    if (token) {
                        this.token = token;
                    }
                    resolve(token);
                } catch (error) {
                    reject(error);
                }
            });
        }
    }
}
