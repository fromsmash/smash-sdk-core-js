import { Region, Global as GlobalRegion, RefreshTokenMethod } from "../client/types";
import { InvalidRegionError } from "../errors/sdkError";
import { isNode } from "../helper/node";
import { SmashEnvRegion, SmashEnvToken } from "./types/index";
import { version } from '../version';
import { RefreshTokenManager } from "../helper/refreshTokenManager";

const globalKey = Symbol('smashSdkConfig_' + version);
export interface RegionalHost {
    "eu-west-1"?: string;
    "eu-west-2"?: string;
    "eu-west-3"?: string;
    "eu-central-1"?: string;
    "us-east-1"?: string;
    "us-east-2"?: string;
    "us-west-1"?: string;
    "us-west-2"?: string;
    "ca-central-1"?: string;
}

export interface GlobalHost {
    global: string;
}

export interface Hosts {
    [key: string]: GlobalHost | RegionalHost
};

declare global {
    namespace NodeJS {
        interface Global {
            [globalKey]?: Config;
            //Note: data format should never change in the next release for the 5 next properties
            smashSdkHosts?: Hosts;
            smashSdkToken?: string;
            smashSdkRegion?: Region | GlobalRegion;
            smashSdkRefreshTokenMethod?: RefreshTokenMethod;
            smashSdkRefreshTokenManager?: RefreshTokenManager;
        }
    }

    interface Window {
        [globalKey]?: Config;
        //Note: data format should never change in the next release for the 5 next properties
        smashSdkHosts?: Hosts;
        smashSdkToken?: string;
        smashSdkRegion?: Region | GlobalRegion;
        smashSdkRefreshTokenMethod?: RefreshTokenMethod;
        smashSdkRefreshTokenManager?: RefreshTokenManager;
    }
}

export class Config {

    private static instance: Config;

    get hosts(): Hosts {
        if (isNode()) {
            if (!(global as NodeJS.Global).smashSdkHosts) {
                (global as NodeJS.Global).smashSdkHosts = {};
            }
            return (global as NodeJS.Global).smashSdkHosts!;
        } else {
            if (!(window as Window).smashSdkHosts) {
                (window as Window).smashSdkHosts = {};
            }
            return window.smashSdkHosts!;
        }
    }

    set hosts(hosts: Hosts) {
        if (isNode()) {
            (global as NodeJS.Global).smashSdkHosts! = hosts;
        } else {
            window.smashSdkHosts = hosts;
        }
    }

    get token(): string | undefined {
        if (isNode()) {
            return (global as NodeJS.Global).smashSdkToken;
        } else {
            return window.smashSdkToken;
        }
    }

    set token(token: string | undefined) {
        if (isNode()) {
            (global as NodeJS.Global).smashSdkToken = token;
        } else {
            window.smashSdkToken = token;
        }
    }

    get region(): Region | GlobalRegion | undefined {
        if (isNode()) {
            return (global as NodeJS.Global).smashSdkRegion;
        } else {
            return window.smashSdkRegion;
        }
    }

    set region(region: Region | GlobalRegion | undefined) {
        if (isNode()) {
            (global as NodeJS.Global).smashSdkRegion = region;
        } else {
            window.smashSdkRegion = region;
        }
    }

    get refreshTokenMethod(): RefreshTokenMethod | undefined {
        if (isNode()) {
            return (global as NodeJS.Global).smashSdkRefreshTokenMethod;
        } else {
            return window.smashSdkRefreshTokenMethod;
        }
    }

    set refreshTokenMethod(refreshTokenMethod: RefreshTokenMethod | undefined) {
        if (isNode()) {
            (global as NodeJS.Global).smashSdkRefreshTokenMethod = refreshTokenMethod;
        } else {
            window.smashSdkRefreshTokenMethod = refreshTokenMethod;
        }
        if (refreshTokenMethod) {
            this.refreshtokenManager = new RefreshTokenManager(refreshTokenMethod);
        } else {
            this.refreshtokenManager = undefined;
        }
    }

    get refreshtokenManager(): RefreshTokenManager | undefined {
        if (isNode()) {
            return (global as NodeJS.Global).smashSdkRefreshTokenManager;
        } else {
            return window.smashSdkRefreshTokenManager;
        }
    }

    set refreshtokenManager(refreshTokenManager: RefreshTokenManager | undefined) {
        if (isNode()) {
            (global as NodeJS.Global).smashSdkRefreshTokenManager = refreshTokenManager;
        } else {
            window.smashSdkRefreshTokenManager = refreshTokenManager;
        }
    }

    public static get Instance() {
        if (isNode()) {
            if (!(global as NodeJS.Global)[globalKey]) {
                Config.instance = new Config();
                (global as NodeJS.Global)[globalKey] = Config.instance
            }
            Config.instance = (global as NodeJS.Global)[globalKey] as Config;
        } else {
            if (!(window as Window)[globalKey]) {
                Config.instance = new Config();
                (window as Window)[globalKey] = Config.instance
            }
            Config.instance = window[globalKey] as Config;
        }
        return Config.instance;
    }

    constructor() {
        if (isNode()) {
            if (process?.env) {
                if (process?.env[SmashEnvRegion]) {
                    this.setRegion(process.env[SmashEnvRegion] as Region);
                }
                if (process?.env[SmashEnvToken]) {
                    this.setToken(process.env[SmashEnvToken] as string);
                }
            }
        }
    }

    getHost(service: keyof Hosts, region: Region | GlobalRegion = "global"): string {
        if (region === "global" && (this.hosts[service] as GlobalHost)[region as keyof GlobalHost]) {
            return (this.hosts[service] as GlobalHost)[region as keyof GlobalHost];
        } else if ((this.hosts[service] as RegionalHost)[region as keyof RegionalHost]) {
            return (this.hosts[service] as RegionalHost)[region as keyof RegionalHost] as string;
        } else {
            throw new InvalidRegionError("Invalid region asked: " + region + " for service " + service + ", available regions are " + Object.keys((this.hosts[service] as RegionalHost)).join(", ") + ".");
        }
    }

    setHosts(service: string, hosts: RegionalHost | GlobalHost) {
        this.hosts[service] = hosts;
    }

    setRegion(region: Region) {
        this.region = region;
    }

    getRegion(): Region | GlobalRegion | undefined {
        return this.region;
    }

    setToken(token: string) {
        this.token = token;
    }

    getToken(): string | undefined {
        return this.token;
    }

    setRefreshTokenMethod(refreshtokenMethod: RefreshTokenMethod) {
        this.refreshTokenMethod = refreshtokenMethod;
    }

    getRefreshTokenMethod(): RefreshTokenMethod | undefined {
        return this.refreshTokenMethod;
    }

    getRefreshTokenManager(): RefreshTokenManager | undefined {
        return this.refreshtokenManager;
    }
}

export const config = Config.Instance;