import { omit } from '../../src/helper/omit'

describe('Omit', () => {
    it('omit with simple object to omit', () => {
        const arg1 = {
            1: '1',
            2: '2',
            3: '3',
            4: '4',
        };
        const arg2 = {
            3: '3',
            4: '4',
        };
        const expected = {
            1: '1',
            2: '2',
        };
        const result = omit(arg1, arg2);
        expect(result).toEqual(expected);
    });

    it('omit with array of simple objects to omit', () => {
        const arg1 = {
            1: '1',
            2: '2',
            3: '3',
            4: '4',
            5: '5',
            6: '6',
        };
        const arg2 = {
            3: '3',
        };

        const arg3 = {
            5: '5',
            6: '6',
        };
        const expected = {
            1: '1',
            2: '2',
            4: '4',
        };
        const result = omit(arg1, [arg2, arg3]);
        expect(result).toEqual(expected);
    });

    it('omit with empty object to omit', () => {
        const arg1 = {
            1: '1',
            2: '2',
            3: '3',
            4: '4',
            5: '5',
            6: '6',
        };
        const result = omit(arg1, {});
        expect(result).toEqual(arg1);
    });

    it('omit with empty object as input', () => {
        const arg2 = {
            3: '3',
        };

        const arg3 = {
            5: '5',
            6: '6',
        };
        const result = omit({}, [arg2, arg3]);
        expect(result).toEqual({});
    });
});