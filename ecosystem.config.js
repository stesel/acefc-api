module.exports = {
    apps: [
        {
            name: "my-app", // Application name
            script: "npm", // Specify npm as the script to run
            args: "run start", // Pass the npm script name as arguments
            instances: 1, // Number of instances to run
            autorestart: true, // Restart if the app crashes
            watch: false, // Disable file watching
            max_memory_restart: "200M", // Restart if memory exceeds 200 MB
            env: {
                // Environment variables for development
                NODE_ENV: "development",
            },
            env_production: {
                // Environment variables for production
                NODE_ENV: "production",
            },
        },
    ],
};
