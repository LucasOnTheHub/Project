---
type: master
role: core-star
project: Project.
version: 0.9.0
status: active
created: 2026-04-12
author: LucasOnTheHub
tags: [core, guideline, architecture, vision]
gravity: 1.0
---

# Project. — Guideline maîtresse

> Ce fichier est l'**étoile centrale** du vault `Project.`.
> Tous les autres fichiers orbitent autour de lui via leur propriété `project:` et leur `gravity:`.
> Il doit rester le point de vérité pour la vision, l'architecture et les conventions.

---

## 1. Vision

**Project.** est un gestionnaire de projets *file-based* (comme un Vault Obsidian) avec une interface **3D spatiale** où chaque projet est représenté comme un **système solaire** :

- **Étoile centrale** → fichier maître du projet (ce type de fichier, `type: master`)
- **Planètes / nodes** → fichiers du projet (`.md`, `.py`, `.jsx`, `.json`, assets, etc.)
- **Orbites** → relation gravitationnelle au cœur, définie par la propriété `gravity`
- **Liens directs** → arêtes explicites entre nodes (équivalent des `[[wikilinks]]` Obsidian)
- **Galaxie** → ensemble des projets visibles simultanément, chacun avec son étoile

L'objectif n'est **pas** de remplacer un IDE ou Obsidian, mais d'offrir une **couche d'orchestration visuelle et sémantique** au-dessus d'un simple dossier de fichiers, pilotable **à 100 % par une IA via MCP**.

---

## 2. Principes directeurs

1. **File-first** — Aucune donnée n'existe uniquement en base. Tout est un fichier sur disque, lisible hors de l'app, versionnable par git.
2. **Open format** — Les métadonnées vivent dans un front-matter YAML (pour les fichiers texte) ou dans un sidecar `.project.yml` (pour les binaires et fichiers code qui ne supportent pas de front-matter non-invasif).
3. **Type-agnostic** — Le système accepte *n'importe quel* type de fichier. Le type détermine uniquement le rendu du node et les actions contextuelles, pas sa capacité à exister dans le graphe.
4. **MCP-native** — Toute action utilisateur doit être réalisable via l'API MCP. L'UI est un client parmi d'autres.
5. **Local-first** — Fonctionne offline. La synchro (git, cloud) est optionnelle.
6. **Physique comme sémantique** — La position spatiale n'est pas décorative : elle *signifie* quelque chose (gravité = importance, distance = couplage, cluster = sous-système).

---

## 3. Architecture fichiers

```
MyProject/
├── .project/
│   ├── config.yml           # config du vault
│   ├── index.db             # cache SQLite (reconstructible)
│   └── sidecars/            # métadonnées pour fichiers non-textuels
│       └── assets/logo.png.project.yml
├── guideline.md             # ⭐ étoile centrale (type: master)
├── docs/
│   ├── architecture.md
│   └── roadmap.md
├── src/
│   ├── main.py
│   └── ui/App.jsx
└── assets/
    └── logo.png
```

Le dossier `.project/` est l'équivalent du `.obsidian/` d'Obsidian : il contient la config et un cache, jamais de données canoniques.

---

## 4. Schéma de métadonnées (front-matter)

Chaque fichier trackable expose (au minimum) :

```yaml
---
type: master | doc | code | asset | task | note | reminder
project: Project.          # nom du projet parent (= étoile)
gravity: 0.0 → 1.0         # force d'attraction vers le cœur (1.0 = collé, 0.0 = libre)
links: [file1.md, src/main.py]   # liens explicites sortants
tags: [arch, backend]
status: draft | active | done | archived
created: YYYY-MM-DD
---
```

### Champs spécifiques par `type`

- **`task`** : `due`, `priority`, `parent` (pour les sous-tâches), `assignee`, `done: bool`
- **`reminder`** : `trigger` (cron ou ISO date), `channel` (notif, mcp, email), `recurring: bool`
- **`code`** : `language`, `entrypoint: bool`
- **`asset`** : `mime`, `size`

Règle d'or : **tout champ inconnu est conservé tel quel**. Le système ne doit jamais strip une propriété qu'il ne comprend pas.

---

## 5. Modèle 3D & physique

- **Moteur** : three.js + react-three-fiber (côté renderer).
- **Étoile** : sphère émissive, taille ∝ nombre de fichiers du projet.
- **Nodes** : mesh dont la forme dépend du `type` (cube pour code, sphère pour doc, tétraèdre pour task…).
- **Force gravitationnelle** : chaque node subit une attraction vers son étoile proportionnelle à `gravity × masse_étoile / distance²`. Un node avec `gravity: 0` dérive librement.
- **Liens** : arêtes lumineuses (lignes courbes géodésiques) entre nodes liés. Un lien agit comme un ressort qui rapproche deux nodes.
- **Clusters** : les nodes partageant des `tags` subissent une faible attraction mutuelle → formation naturelle de constellations.
- **Caméra** : navigation libre (orbit + fly), focus automatique sur un node au clic.
- **LOD** : au-delà d'une distance seuil, les labels disparaissent et les nodes deviennent des points lumineux (lisibilité à l'échelle galaxie).

---

## 6. API MCP — surface à exposer

Le serveur MCP `project-mcp` doit exposer au minimum :

### Ressources
- `project://{name}` — lecture du master file
- `project://{name}/files` — liste complète
- `project://{name}/graph` — graphe sérialisé (nodes + edges)

### Tools
- `list_projects()`
- `create_project(name, master_content)`
- `create_node(project, path, type, content, metadata)`
- `update_node(project, path, patch)`
- `delete_node(project, path)`
- `link_nodes(project, from, to)`
- `set_gravity(project, path, value)`
- `create_task(project, title, parent?, due?)`
- `toggle_task(project, path)`
- `create_reminder(project, title, trigger, channel)`
- `search(project?, query)` — plein-texte + métadonnées
- `export_project(project, format)` — `zip`, `md-bundle`, `json-graph`

Règle : chaque tool doit être **idempotent quand c'est possible** et retourner l'état post-action, pas juste un OK.

---

## 7. Stack technique (proposition)

| Couche | Choix |
|---|---|
| Runtime | Electron + Node (desktop, pour l'accès fichier natif) |
| UI | React + TypeScript |
| 3D | three.js + @react-three/fiber + @react-three/drei |
| Physique | custom (force-directed + gravité radiale) ou `d3-force-3d` |
| Parser front-matter | `gray-matter` |
| Watcher fichiers | `chokidar` |
| Index | SQLite via `better-sqlite3` (FTS5 pour la recherche) |
| MCP | SDK officiel `@modelcontextprotocol/sdk` (serveur stdio + HTTP) |
| Tests | vitest |

À challenger — aucune de ces briques n'est gravée dans le marbre tant que le MVP n'est pas figé.

---

## 8. Roadmap indicative

- **M0 — Fondations** ✅ : lecture/écriture vault, front-matter, index SQLite, CLI debug.
- **M1 — MCP** ✅ : serveur MCP fonctionnel avec les tools de §6. Claude peut créer un projet et des nodes de bout en bout sans UI. 22 tests verts.
- **M2 — UI 2D** ✅ : vue graphe plate (d3) dans Electron — couleurs par type, taille par gravity, clustering par tags, tooltip metadata, zoom/pan.
- **M3 — UI 3D** ✅ : passage three.js + react-three-fiber, étoile émissive, nodes 3D par type, gravité radiale, liens lumineux, OrbitControls, LOD labels, star field.
- **M4 — Tâches & rappels** ✅ : TaskPanel (liste/checkbox, sous-tâches indentées), `ReminderScheduler` Windows (schtasks), IPC toggle-task, physique parent→enfant 3D.
- **M5 — Export & sync** ✅ : ExportService (zip réel via archiver, md-bundle), GitSync (simple-git), 4 MCP tools git, GitPanel UI Electron (droite), types git partagés.
- **M6 — Galaxie multi-projets** ✅ : MultiVaultReader, GalaxyGraph, GalaxyCanvas3D, mode switcher Solo/Galaxie.
- **M7 — HTTP/SSE MCP** ✅ : second transport réseau en parallèle du stdio. Accès depuis un web client ou un agent distant sans Electron.
- **M8 — UX fluidité & LOD** ✅ : transitions caméra ease-in-out (smoothstep), InstancedMesh pour les NodePoints en vue galaxie, labels LOD opacity par distance, pulse des étoiles en vue galaxie, blocage des interactions pendant les vols caméra.
- **M9 — Build & distribution** ✅ : electron-builder (NSIS/DMG/AppImage+deb), chemins asar-safe dans main.ts (app.getAppPath() + userData vault fallback), CI GitHub Actions (ci.yml + release.yml), matrix build Windows/macOS/Linux, publish GitHub Releases sur tag v*.

---

## 9. Conventions de développement

- **Commits** : Conventional Commits (`feat:`, `fix:`, `docs:`…).
- **Branches** : `main` protégée, features sur `feat/xxx`.
- **Code style** : Prettier + ESLint, TypeScript strict.
- **Tests** : toute route MCP doit avoir au moins un test d'intégration.
- **Docs** : chaque décision d'architecture non-triviale → un fichier `docs/adr-XXX.md` (type: `doc`, gravity élevée, linké à ce guideline).

---

## 10. Décisions d'architecture

*Tranchées avant M1 — 2026-04-12*

### Sidecars
- [x] **`foo.ext.project.yml` à côté du binaire** (ex: `logo.png.project.yml`).
  Le sidecar vit et meurt avec son fichier. Un `mv`/`rm` reste cohérent sans logique de sync centralisée.
  → Le watcher `chokidar` doit filtrer les `*.project.yml` pour ne pas les indexer comme nodes.

### Tâches
- [x] **Fichiers dédiés** (`type: task`).
  Un fichier = un node = un objet physique dans le graphe 3D. Permet le linking individuel via MCP, impossible avec des blocs inline.

### Scheduler des rappels
- [x] **Délégation OS encapsulée derrière une interface `ReminderScheduler`**.
  Aucun process daemon maison. Trois implémentations :

  ```typescript
  interface ReminderScheduler {
    schedule(reminder: Reminder): Promise<void>
    cancel(reminderId: string): Promise<void>
    list(): Promise<ScheduledReminder[]>
  }
  // MacOSScheduler   → launchd (plist ~/Library/LaunchAgents)
  // LinuxScheduler   → systemd user timers ou cron
  // WindowsScheduler → schtasks CLI
  ```

  Le reminder déclenche l'app via deep link `project://remind?id=xxx` ou l'outil MCP `trigger_reminder`.
  Pour M4 : implémenter la plateforme cible principale, plugger les autres ensuite.

### Permissions MCP
- [x] **Granulaire — 3 scopes** :

  | Scope | Tools couverts |
  |---|---|
  | `read` | `list_projects`, `search`, lecture graph/node |
  | `write` | `create_node`, `update_node`, `link_nodes`, `set_gravity`, `create_task`, `toggle_task`, `create_reminder` |
  | `admin` | `delete_node`, `delete_project`, `export_project`, `create_project` |

  Configuration dans `.project/config.yml` :

  ```yaml
  mcp:
    default_scope: read
    agents:
      claude-code: [read, write]
      claude-desktop: [read, write, admin]
  ```

  Règle : `write` = réversible (git). `admin` = irréversible ou structurant, accordé explicitement.

### Gestion des conflits
- [x] **Last-write-wins pour M1** (hypothèse documentée, non adressée).
  Adresser en M5 avec la couche de sync git. Aucun lockfile, aucun diff UI avant M5.

### IndexDB — lazy init (décidé en M1)
- [x] **`VaultManager` ouvre la DB en lazy** (au premier accès, pas au constructeur).
  Raison : `create_project` doit d'abord créer `.project/` avant que SQLite puisse ouvrir le fichier.
  Le constructeur ne touche pas le disque. La DB s'ouvre dès la première opération après que le dossier existe.

### Transport MCP
- [x] **stdio uniquement pour M1**.
  HTTP/SSE différé à M2+ quand une UI web nécessitera un transport réseau.
  Le CLI `project mcp --dir <vault>` démarre le serveur stdio.

### UI 2D — Electron (décidé en M2)
- [x] **Electron pour le renderer 2D** (et donc M3 aussi).
  Choix retenu plutôt qu'une app web serveur ou un fichier HTML standalone, car Electron donne accès direct aux APIs Node sans couche réseau.
  Architecture : main process → `ipcMain.handle('get-graph')` → VaultReader ; renderer → `window.projectAPI.getGraph()` via contextBridge.
  Stack UI : React + d3-force (SVG). Build séparé via Vite (`vite.config.ui.ts` → `dist-ui/`).
  Lancement : `project ui --dir <vault>` ou `npm run ui`.

### Encodage visuel M2
- [x] Couleur = `NodeType` (7 couleurs distinctes).
- [x] Rayon = `gravity` (plus un node est massif, plus il est proche du master).
- [x] Force radiale : `(1 - gravity) × 300 px` de l'étoile → master collé au centre, nodes libres dérivent vers l'extérieur.
- [x] Edges `link` = traits pleins blancs + flèche ; edges `tag` = tirets gris (affinité de cluster).
- [x] Tooltip au clic : path, type, status, gravity, tags, links, created.

### Export & sync git M5 (décidé en M5 — 2026-04-18)
- [x] **ExportService** (`src/core/exporter.ts`) : deux formats réels.
  - `zip` : archive complète via `archiver` (ignore `.project/`, `node_modules/`, `.git/`, `dist/`). Inclut un `project-index.json` généré à la racine de l'archive.
  - `md-bundle` : concaténation de tous les `.md` avec séparateurs de fichiers, utile pour ingestion LLM.
  - Les deux retournent le path du fichier créé. `json-graph` reste en mémoire (inchangé M1).
- [x] **GitSync** (`src/core/git-sync.ts`) : wrapper `simple-git` CJS chargé dynamiquement (workaround Shadow Cloud identique à three.js).
  - `init()` : idempotent, crée un repo + commit initial avec config user locale.
  - `status()` : retourne `isRepo: false` gracieusement si pas de repo — jamais de throw.
  - `commitAll(msg?)` : stage tout + commit ; retourne `"Nothing to commit."` si rien à faire.
  - `getLog(limit)` : derniers N commits, hash tronqué à 7 chars.
- [x] **Types git partagés** : `src/types/git.ts` — `GitStatusResult`, `GitCommitResult`, `GitLogEntry`. Importés par le renderer (browser) sans toucher aux modules Node.
- [x] **MCP tools git** (admin scope) : `git_init`, `git_status`, `git_commit`, `git_log`. `export_project` étendu avec `format: 'zip' | 'md-bundle' | 'json-graph'`, crée le fichier et retourne son path.
- [x] **GitPanel** (`src/ui/components/GitPanel.tsx`) : overlay React DOM droite (260px), symétrique au TaskPanel. Sections : header branche + badges ahead/behind, liste des changed files (S/M/U colorés), zone commit rapide (input + bouton), log des 10 derniers commits. Bouton `git init` si pas de repo.
- [x] **IPC Electron** : 4 nouveaux handles dans `main.ts` (`git-status`, `git-commit`, `git-log`, `git-init`), exposés via `contextBridge` dans `preload.ts`.
- [x] **Résolution runtime** (Shadow Cloud) : `simple-git` et `archiver` installés dans `/sessions/zen-focused-keller/tmp/m5_deps/node_modules`, chargés via `createRequire` + liste de candidats (project `node_modules` en premier, fallback session-local).

### HTTP/SSE MCP M7 (décidé en M7 — 2026-04-18)
- [x] **Transport** : `StreamableHTTPServerTransport` du SDK officiel (MCP Streamable HTTP spec), **pas** `SSEServerTransport` (deprecated).
  Raison : `SSEServerTransport` est marqué deprecated depuis SDK 1.x. `StreamableHTTPServerTransport` supporte à la fois SSE et réponses HTTP directes selon le client.
- [x] **Fichier dédié** : `src/mcp/http-server.ts` — pas de mélange avec `server.ts` (qui reste orienté stdio).
  `createMcpServer()` est réutilisé tel quel ; le transport HTTP est découplé.
- [x] **Deux modes** :
  - **Stateful** (défaut) : chaque client reçoit un `sessionId` (UUID v4), état conservé en mémoire. Session fermée via `DELETE /mcp` + header `mcp-session-id`.
  - **Stateless** : `sessionIdGenerator: undefined`, chaque requête POST instancie son propre `McpServer`. Utile pour clients HTTP simples (scripts, tests).
- [x] **Endpoints** :
  - `POST /mcp` — requêtes JSON-RPC + initialisation de session
  - `GET  /mcp` — stream SSE (Streamable HTTP spec)
  - `DELETE /mcp` — fermeture de session (stateful uniquement)
  - `GET  /health` — health check JSON (status, sessions actives, vault)
- [x] **CLI** : `project mcp --port 3741` démarre stdio + HTTP en parallèle.
  `project mcp --port 3741 --http-only` désactive stdio (utile pour déploiement web).
  `project mcp --port 3741 --stateless` active le mode sans session.
  `--scope` s'applique aux deux transports.
- [x] **Pas de dépendance Express** : serveur HTTP vanilla Node.js (`http.createServer`), pas de framework. Réduit la surface de dépendances.
- [x] **Sécurité** : bind sur `127.0.0.1` par défaut (loopback-only). `--host 0.0.0.0` possible mais documenté comme risque si exposé sur réseau.

### Tâches & rappels M4 (décidé en M4 — 2026-04-17)
- [x] **WindowsScheduler** (`schtasks /Create`) retenu pour M4 comme plateforme cible principale.
  Interface `ReminderScheduler` identique au guideline §10. MacOS/Linux = stub loggué, branchable en M5.
- [x] **TaskPanel** : overlay React DOM gauche (240px), liste hiérarchique avec checkboxes, barre de progression, tri undone-first.
  Interaction : clic checkbox → IPC `toggle-task` → refresh graph. Clic titre → focus 3D.
- [x] **Sous-tâches 3D** : nodes avec `parent:` = tétraèdres 60 % plus petits + ressort PARENT_SPRING (0.04) vers le parent, rest_len 3 units. Lien visuel orange (EdgeLine kind `parent`).
- [x] **IPC toggle-task** : `ipcMain.handle('toggle-task')` dans main, exposé via `contextBridge` dans preload.
  Après toggle, le renderer re-appelle `getGraph()` pour rafraîchir l'état.

### UI 3D M3 (décidé en M3 — 2026-04-17)
- [x] **Stack** : `three` 0.184 + `@react-three/fiber` 9.6 + `@react-three/drei` 10.7.
- [x] **Géométries par type** : master=sphère XL émissive, doc=sphère, code=cube, task=tétraèdre, note=octaèdre, asset=cylindre, reminder=tore.
- [x] **Physique** : force-directed 3D custom dans `useFrame` — attraction radiale proportionnelle à `gravity`, répulsion entre nodes, ressorts sur les edges.
- [x] **Liens** : `THREE.Line` via `<primitive>` — blancs pour `link`, gris pour `tag`.
- [x] **Étoile** : sphère émissive dorée + halo glow (BackSide transparent).
- [x] **Navigation** : `OrbitControls` libre (orbit + zoom scroll), focus automatique au clic.
- [x] **Labels** : `<Html>` drei, disparaissent quand caméra > ORBIT_SCALE × 3.
- [x] **Star field** : 1200 points aléatoires qui tournent lentement.
- [x] **Tooltip** : panel React DOM en overlay (identique M2, port direct).
- [x] **Workaround CIFS mount** : npm ne peut pas remplacer les fichiers de l'ancienne session sur le mount Shadow Cloud. three.js installé dans `/sessions/.../three_tmp/node_modules`, résolu via `resolve.alias` dans `vite.config.ui.ts`.

---

## 11. Questions ouvertes

*(aucune à ce stade — à alimenter au fil du développement)*

---

*Ce document est vivant. Toute modification de la vision ou de l'architecture doit passer par une mise à jour ici en priorité — c'est littéralement l'étoile qui tient le reste du projet en orbite.*
