export function formatErrorName(name: string) : string {
    if(name.indexOf('Error') === -1) {
        return name + 'Error'
    }
    return name;
}