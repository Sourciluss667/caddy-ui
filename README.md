# Caddy UI

Local dashboard for viewing the sites exposed by Caddy from the machine's
Caddyfile.

The application is a React Router SSR app with shadcn/ui. It reads the
Caddyfile server-side, extracts top-level site blocks, and displays them in a
web interface.

## Deployment Target

This application is intended to run directly on a Debian machine that already
hosts Caddy.

The target deployment deliberately avoids Docker:

- Caddy remains installed and managed by the system.
- The application runs as a Node.js systemd service.
- Caddy reverse-proxies the application to a local port.
- Machine provisioning is managed through Ansible.

## Configuration

By default, the application reads:

```bash
/etc/caddy/Caddyfile
```

The path can be overridden with the `CADDYFILE_PATH` environment variable:

```bash
CADDYFILE_PATH=/etc/caddy/Caddyfile
```

The file is read server-side. Do not expose arbitrary path selection from the UI
on a publicly reachable instance.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The development script currently points to `./Caddyfile.example` through
`CADDYFILE_PATH`, so the app can be tested without reading
`/etc/caddy/Caddyfile`.

Check types:

```bash
npm run typecheck
```

Format the code:

```bash
npm run format
```

## Build and Runtime

Build the application:

```bash
npm run build
```

Start the SSR server:

```bash
CADDYFILE_PATH=/etc/caddy/Caddyfile npm run start
```

## Expected Ansible Provisioning

The Ansible role or playbook should typically:

- install Node.js and npm on Debian;
- deploy the `caddy-ui` source code or build artifact;
- install production dependencies;
- build the application if the build artifact is not already provided;
- create a dedicated system user;
- configure a systemd service that runs `npm run start`;
- inject `CADDYFILE_PATH` into the service environment;
- ensure the service user can read the target Caddyfile;
- add the Caddy configuration that reverse-proxies the UI to the local port;
- reload systemd and Caddy when their configurations change.

Example systemd environment:

```ini
Environment=NODE_ENV=production
Environment=CADDYFILE_PATH=/etc/caddy/Caddyfile
```

## Current Limitations

- The application reads the Caddyfile, but does not modify Caddy configuration.
- The application does not trigger Caddy reloads.
