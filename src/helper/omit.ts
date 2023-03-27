type GenericObject = { [key: string]: unknown };

export function omit(source: GenericObject, toOmit: GenericObject | Array<GenericObject>): GenericObject {
    const result = { ...source };
    if (!Array.isArray(toOmit)) {
        toOmit = [toOmit];
    }
    toOmit.forEach(item => {
        Object.keys(item).forEach(key => {
            delete result[key];
        });
    });
    return result;
}