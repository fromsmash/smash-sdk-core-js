import { ResponseError } from '../../errors/sdkError';
import { HttpClient, HttpClientConfiguration, HttpResponse } from '../../http/types';

export type Region =
    'eu-west-1' |
    'eu-west-2' |
    'eu-west-3' |
    'eu-central-1' |
    'us-east-1' |
    'us-east-2' |
    'us-west-1' |
    'us-west-2' |
    'ca-central-1';

export type Global = 'global';
export type Regional = 'regional';

export enum regions {
    eu_west_1 = 'eu-west-1',
    eu_west_2 = 'eu-west-2',
    eu_west_3 = 'eu-west-3',
    eu_central_1 = 'eu-central-1',
    us_east_1 = 'us-east-1',
    us_east_2 = 'us-east-2',
    us_west_1 = 'us-west-1',
    us_west_2 = 'us-west-2',
    ca_central_1 = 'ca-central-1',
    global = 'global',
}

export type ServiceType = Regional | Global;

export type RefreshTokenMethod = (httpResponse: HttpResponse<ResponseError>, retries: number) => Promise<string | void>;
export interface ClientParameters extends HttpClientConfiguration {
    token?: string;
    client?: HttpClient;
    region?: Region;
    host?: string;
    refreshTokenMethod?: RefreshTokenMethod;
};
