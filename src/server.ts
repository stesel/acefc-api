import "dotenv/config";

import { app } from "./app";

const port = app.get("port");

const server = app.listen(port, onListening);
server.on("error", onError);

function onError(error: NodeJS.ErrnoException) {
    if (error.syscall !== "listen") {
        throw error;
    }

    const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
        case "EADDRINUSE":
            console.error(`${bind} is already in use`);
            process.exit(1);
        default:
            throw error;
    }
}

function onListening() {
    const addr = server.address();
    const bind =
        typeof addr === "string" ? `pipe ${addr}` : `port ${addr?.port}`;
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(
        `PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`,
    );
    console.log(`PROVIDER_URL: ${process.env.PROVIDER_URL}`);

    console.log(`Listening on ${bind}`);
}

export default server;
