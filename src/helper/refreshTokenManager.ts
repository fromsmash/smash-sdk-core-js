import { RefreshTokenMethod } from '../client/types';
import { HttpResponse } from '../http/types';

export class RefreshTokenManager {
    private loading: boolean = false;
    private queue: Array<{ resolve: (token: string | void | undefined) => void, reject: (error: unknown) => void }> = [];
    public refreshTokenMethod: RefreshTokenMethod;

    constructor(refreshTokenMethod: RefreshTokenMethod) {
        this.refreshTokenMethod = refreshTokenMethod;
    }

    getRefreshTokenMethod(): RefreshTokenMethod {
        return (error: HttpResponse<any>, retries: number = 0) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const token = await this.refreshToken(this.refreshTokenMethod, error, retries);
                    resolve(token);
                } catch (error) {
                    reject(error);
                }
            });
        }
    }

    refreshTokenAtomic(refreshTokenMethod: RefreshTokenMethod, error: HttpResponse<any>, retries: number = 0): Promise<string | void> {
        return new Promise(async (resolve, reject) => {
            try {
                this.loading = true;
                const token = await refreshTokenMethod(error, retries);
                resolve(token);
                this.queue.forEach(({ resolve }) => {
                    resolve(token);
                });
                this.loading = false;
                this.queue = [];
            } catch (error: unknown) {
                reject(error);
                this.queue.forEach(({ reject }) => {
                    reject(error);
                });
                this.loading = false;
                this.queue = [];
            }
        });
    }

    refreshToken(refreshTokenMethod: RefreshTokenMethod, error: HttpResponse<any>, retries: number = 0): Promise<string | void> {
        return new Promise((resolve, reject) => {
            if (this.loading === true) {
                this.queue.push({ resolve, reject });
            } else {
                this.refreshTokenAtomic(refreshTokenMethod, error, retries).then(resolve).catch(reject);
            }
        });
    }
}

