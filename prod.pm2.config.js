export const apps = [
        {
            name: "im-rpa",
            cwd: "/home/ubuntu/im-rpa",
            script: "npm",
            args: "start",
            env: {
                "LOCAL": false,
                "ENV": "PROD",
                "SERVER_ENV": "PROD",
                "PORT": 6000,
                "ENABLE_CRONS": true,
            },
            max_restarts: 10,
            autorestart: true,
            min_uptime: "10s",
            listen_timeout: 3000,
            kill_timeout: 3000
        }
]