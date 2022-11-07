import { Region, Global } from "../client/types";
import { SDKError } from "../errors/sdkError";
import { SmashEnvRegion, SmashEnvToken } from "./types/index";

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
            smashSdkConfig?: Config;
        }
    }

    interface Window {
        smashSdkConfig?: Config;
    }
}

export class Config {

    private static instance: Config;

    hosts: Hosts = {};
    token?: string;
    region?: Region | Global;

    public static get Instance() {
        if (isNode()) {
            if (!(global as NodeJS.Global).smashSdkConfig) {
                Config.instance = new Config();
                (global as NodeJS.Global).smashSdkConfig = Config.instance
            }
            Config.instance = (global as NodeJS.Global).smashSdkConfig as Config;
        } else {
            if (!(window as Window).smashSdkConfig) {
                Config.instance = new Config();
                (window as Window).smashSdkConfig = Config.instance
            }
            Config.instance = window.smashSdkConfig as Config;
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

    getHost(service: keyof Hosts, region: Region | Global = "global"): string {
        if (region === "global") {
            return (this.hosts[service] as GlobalHost)[region as keyof GlobalHost];
        } else if ((this.hosts[service] as RegionalHost)[region as keyof RegionalHost]) {
            return (this.hosts[service] as RegionalHost)[region as keyof RegionalHost] as string;
        } else {
            throw new SDKError("Invalid region asked: " + region + " for service " + service + ", available regions are " + Object.keys((this.hosts[service] as RegionalHost)).join(", ") + ".");
        }
    }

    setHosts(service: string, hosts: RegionalHost | GlobalHost) {
        this.hosts[service] = hosts;
    }

    setRegion(region: Region) {
        this.region = region;
    }

    getRegion(): Region | Global | undefined {
        return this.region;
    }

    setToken(token: string) {
        this.token = token;
    }

    getToken(): string | undefined {
        return this.token;
    }
}


let cachedIsNode: boolean;
let called = false;
const detect = new Function('try {return this===global;}catch(e){return false;}');

function isNode(): boolean {
    if (called) {
        return cachedIsNode;
    }
    cachedIsNode = detect();
    called = true;
    return cachedIsNode;
}

export const config = Config.Instance;