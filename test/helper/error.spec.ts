import { formatErrorName } from '../../src/helper/error';

describe('Omit', () => {
    it('add Error string if missing from errorName', () => {
        const result = formatErrorName('Unauthorized');
        expect(result).toEqual('UnauthorizedError');
    });

    it('return errorName as it is if Error already there  ', () => {
        const result = formatErrorName('UnauthorizedError');
        expect(result).toEqual('UnauthorizedError');
    });
});