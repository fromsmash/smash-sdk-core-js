import { Region } from "../client/types";

export const swappedRegions: { [key: string]: Region } = {
    a: "eu-west-1",
    b: "eu-west-2",
    c: "eu-west-3",
    d: "eu-central-1",
    e: "us-east-1",
    f: "us-east-2",
    g: "us-west-1",
    h: "us-west-2",
    i: "ca-central-1",
};

export function getRegionFromId(id: string): Region {
    return swappedRegions[id[id.length - 2] as keyof typeof swappedRegions];
}

export function isValidTeamId(id: string): boolean {
    const regexp = new RegExp('^.*-7[' + Object.keys(swappedRegions).join('') + ']$');
    return regexp.test(id);
}

export function getAvailableRegions(): Region[] {
    return Object.values(swappedRegions);
}