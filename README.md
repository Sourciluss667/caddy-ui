# Caddy UI

Dashboard local pour visualiser les sites exposes par Caddy a partir du
Caddyfile de la machine.

L'application est une app React Router SSR avec shadcn/ui. Elle lit le
Caddyfile cote serveur, extrait les blocs de sites top-level, puis les affiche
dans une interface web.

## Cible de deploiement

Cette application a vocation a tourner directement sur une machine Debian qui
heberge deja Caddy.

Le deploiement cible est volontairement sans Docker:

- Caddy reste installe et gere par le systeme.
- L'application tourne comme service systemd Node.js.
- Caddy reverse-proxy l'application vers un port local.
- Le provisioning de la machine est gere via Ansible.

## Configuration

Par defaut, l'application lit:

```bash
/etc/caddy/Caddyfile
```

Le chemin peut etre surcharge avec la variable d'environnement
`CADDYFILE_PATH`:

```bash
CADDYFILE_PATH=/etc/caddy/Caddyfile.j2
```

Le fichier est lu cote serveur. Il ne faut donc pas exposer un choix de chemin
arbitraire depuis l'UI sur une instance accessible publiquement.

## Developpement local

Installer les dependances:

```bash
npm install
```

Lancer le serveur de dev:

```bash
npm run dev
```

Le script de dev pointe actuellement vers `./Caddyfile.j2` via
`CADDYFILE_PATH`, ce qui permet de tester sans lire `/etc/caddy/Caddyfile`.

Verifier les types:

```bash
npm run typecheck
```

Formatter le code:

```bash
npm run format
```

## Build et execution

Construire l'application:

```bash
npm run build
```

Lancer le serveur SSR:

```bash
CADDYFILE_PATH=/etc/caddy/Caddyfile npm run start
```

## Provisioning Ansible attendu

Le role/playbook Ansible devra typiquement:

- installer Node.js et npm sur Debian;
- deployer le code ou l'artefact build de `caddy-ui`;
- installer les dependances de production;
- construire l'application si le build n'est pas deja fourni;
- creer un utilisateur systeme dedie;
- configurer un service systemd qui lance `npm run start`;
- injecter `CADDYFILE_PATH` dans l'environnement du service;
- s'assurer que l'utilisateur du service peut lire le Caddyfile cible;
- ajouter la configuration Caddy qui reverse-proxy l'UI vers le port local;
- recharger systemd et Caddy lorsque leurs configurations changent.

Exemple d'environnement systemd:

```ini
Environment=NODE_ENV=production
Environment=CADDYFILE_PATH=/etc/caddy/Caddyfile
```

## Limites actuelles

- Les templates Jinja (`.j2`) sont scannes statiquement: les variables, boucles
  et conditions ne sont pas rendues.
- L'application lit le Caddyfile, mais ne modifie pas la configuration Caddy.
- L'application ne declenche pas de reload Caddy.
