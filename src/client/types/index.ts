import { HttpClient, HttpResponse } from "../../http/types";

export type Region =
    "eu-west-1" |
    "eu-west-2" |
    "eu-west-3" |
    "eu-central-1" |
    "us-east-1" |
    "us-east-2" |
    "us-west-1" |
    "us-west-2" |
    "ca-central-1";

export type Global = "global";

export type RefreshTokenMethod = (error: HttpResponse<any>, retries?: number) => Promise<string>;
export interface ClientParameters {
    token?: string;
    client?: HttpClient;
    region?: Region;
    host?: string;
    refreshTokenMethod?: RefreshTokenMethod;
}
