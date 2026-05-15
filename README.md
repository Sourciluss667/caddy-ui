# Caddy UI

Local dashboard for viewing the sites exposed by Caddy from the machine's
Caddyfile.

The application is a React Router SSR app with shadcn/ui. It reads the
Caddyfile server-side, extracts top-level site blocks, and displays them in a
web interface.

## Deployment Target

This application is intended to run directly on a Debian machine that already
hosts Caddy.

Deployment model:

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

Enable Corepack so the project uses pnpm consistently:

```bash
corepack enable
```

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm run dev
```

The development script currently points to `./Caddyfile.example` through
`CADDYFILE_PATH`, so the app can be tested without reading
`/etc/caddy/Caddyfile`.

Check types:

```bash
pnpm run typecheck
```

Format the code:

```bash
pnpm run format
```

## Build and Runtime

Build the application:

```bash
pnpm run build
```

Start the SSR server:

```bash
CADDYFILE_PATH=/etc/caddy/Caddyfile pnpm run start
```

## GitHub Releases

Releases are built by GitHub Actions for Debian 13-compatible Linux amd64
servers. Pushing a tag named `v*` creates a GitHub Release with:

- `caddy-ui-<version>-linux-amd64.tar.gz`, containing `build/`,
  production `node_modules/`, `package.json`, and `pnpm-lock.yaml`;
- `SHA256SUMS`, used to verify the downloaded archive.

Create a release from a clean working tree:

```bash
pnpm run release
```

The first release uses `v0.1.0`. If that tag already exists, the release command
bumps the patch version automatically before creating and pushing the next tag.
You can request a larger bump with `pnpm run release -- minor` or
`pnpm run release -- major`.

Example deployment on Debian 13:

```bash
VERSION=v0.1.0
OWNER=your-github-owner
REPO=caddy-ui

curl -L -O "https://github.com/${OWNER}/${REPO}/releases/download/${VERSION}/caddy-ui-${VERSION}-linux-amd64.tar.gz"
curl -L -O "https://github.com/${OWNER}/${REPO}/releases/download/${VERSION}/SHA256SUMS"
sha256sum -c SHA256SUMS

sudo mkdir -p "/opt/caddy-ui/releases/${VERSION}"
sudo tar -xzf "caddy-ui-${VERSION}-linux-amd64.tar.gz" -C "/opt/caddy-ui/releases/${VERSION}" --strip-components=1
sudo ln -sfn "/opt/caddy-ui/releases/${VERSION}" /opt/caddy-ui/current
```

The Debian host should run the same major Node.js version as the release
workflow: Node.js 22 LTS. Keep `corepack` enabled so `pnpm` is available to run
the packaged application.

## Expected Ansible Provisioning

The Ansible role or playbook should typically:

- install Node.js 22 LTS and enable Corepack/pnpm on Debian 13;
- download the `caddy-ui` GitHub Release artifact;
- verify the release artifact with `SHA256SUMS`;
- deploy the extracted artifact under `/opt/caddy-ui/releases/<version>`;
- update `/opt/caddy-ui/current` to point to the deployed version;
- create a dedicated system user;
- configure a systemd service that runs `pnpm run start`;
- inject `CADDYFILE_PATH` into the service environment;
- ensure the service user can read the target Caddyfile;
- add the Caddy configuration that reverse-proxies the UI to the local port;
- reload systemd and Caddy when their configurations change.

Example systemd environment:

```ini
Environment=NODE_ENV=production
Environment=CADDYFILE_PATH=/etc/caddy/Caddyfile
WorkingDirectory=/opt/caddy-ui/current
ExecStart=/usr/bin/pnpm run start
```

## Current Limitations

- The application reads the Caddyfile, but does not modify Caddy configuration.
- The application does not trigger Caddy reloads.
