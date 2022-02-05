/**
 * Depending on local development or emulator usage
 * the service bridge is differen
 * - local js => java object reference
 * - local + webos emulator => luna service bus
 */
export default class MockFileServiceAdapter implements FileServiceInterface {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async writeEpgCache(data: unknown): Promise<WebOSTV.OnCompleteSuccessResponse> {
        return { returnValue: true };
    }

    async readEpgCache<T>(): Promise<EpgSuccessResponse<T>> {
        return { returnValue: true, result: {} as T };
    }
}
