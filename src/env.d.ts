declare namespace NodeJS {
    export interface ProcessEnv {
        PROVIDER_URL: string;
        PUPPETEER_EXECUTABLE_PATH: string;
        DB_FILE_PATH: string;
    }
}
