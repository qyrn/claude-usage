<div align="center">

<img src="resources/icon.svg" width="110" height="110" alt="Icône Claude Usage" />

# Claude Usage

Le pourcentage de ta session Claude, affiché à côté de l'horloge.

[![Télécharger](https://img.shields.io/github/v/release/qyrn/claude-usage?label=t%C3%A9l%C3%A9charger&color=d97757&style=for-the-badge)](../../releases/latest)
[![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011-3a3632?style=for-the-badge)](../../releases/latest)

<br />

<img src="docs/hero.png" width="600" alt="Le panneau Claude Usage ouvert au-dessus de la barre des tâches" />

</div>

<br />

J'en avais marre d'ouvrir un terminal et de taper `/usage` pour savoir s'il me restait de la marge sur Claude. Alors j'ai fait cette petite app : une icône dans la barre des tâches qui montre où en est ta session, et un panneau qui s'ouvre quand tu cliques dessus.

## 👀 Ce qu'il y a dedans

Le chiffre dans l'icône, c'est ta session de 5 heures. La petite barre en dessous se remplit en même temps.

Clique dessus et tu as le reste : ta limite de la semaine, celle par modèle si ton abonnement en a une, et l'heure à laquelle chaque compteur repart à zéro. Si tu as payé des crédits en plus de ton forfait, le montant est affiché en bas.

Pas envie de cliquer ? Passe juste la souris sur l'icône, les chiffres apparaissent dans une bulle.

## 🚦 Les couleurs

<div align="center">
<img src="docs/states.png" width="500" alt="Icône en orange à 24 %, en jaune à 76 %, en rouge à 94 %" />
</div>

En orange, tout va bien. Elle passe au jaune à 70 %, là tu commences à avoir bien tapé dedans. Au rouge, à 90 %, il est temps de ralentir, ou d'aller prendre un café en attendant le reset.

## 🌗 Clair ou sombre

Le panneau prend tout seul les couleurs de ton Windows.

<div align="center">
<img src="docs/panel-dark.png" width="320" alt="Panneau en thème sombre" />
&nbsp;&nbsp;
<img src="docs/panel-light.png" width="320" alt="Panneau en thème clair" />
</div>

## 🖱️ Le clic droit

<div align="center">
<img src="docs/menu.png" width="400" alt="Menu clic droit : Rafraîchir, Lancer au démarrage de Windows, Rechercher des mises à jour, Version, Quitter" />
</div>

Pour forcer une mise à jour des chiffres, empêcher l'app de se lancer avec Windows, ou vérifier si une nouvelle version est sortie.

## 📥 Installation

1. Télécharge `claude-usage-setup-x.x.x.exe` sur la [page des versions](../../releases/latest).
2. Double-clique dessus. Aucune question, pas besoin d'être administrateur, c'est installé en quelques secondes.
3. Sur Windows 11, l'icône atterrit souvent dans le petit menu caché (la flèche `^` près de l'horloge). Fais-la glisser dans la barre des tâches pour la garder à l'œil.

Ensuite, elle se lance toute seule à chaque démarrage du PC.

Il faut avoir Claude Code installé et connecté à ton compte Claude. Si ce n'est pas fait, ouvre un terminal, tape `claude`, puis `/login`.

> [!NOTE]
> La première fois, Windows va sûrement afficher une fenêtre bleue « Windows a protégé votre ordinateur ». Il fait ça avec toutes les petites apps qu'il ne connaît pas encore. Clique sur « Informations complémentaires », puis sur « Exécuter quand même ».

## 🔄 Les mises à jour

Quand je sors une nouvelle version, l'app la télécharge dans son coin et t'envoie une notification. Tu cliques dessus, elle redémarre, c'est à jour. Si tu ne cliques pas, elle s'installera la prochaine fois que l'app se ferme.

## 🔒 Et tes données ?

L'app utilise la connexion que Claude Code a déjà enregistrée sur ton PC, donc tu n'as rien à taper. Elle pose à Anthropic la même question que la commande `/usage`, et c'est tout. Je ne récupère rien, et il n'y a aucun serveur à moi entre les deux.

Si un pote l'installe, il voit son usage à lui, pas le tien.

## 🤔 Si ça coince

<details>
<summary><b>« Token expiré » ou « Token refusé »</b></summary>
<br />
Ouvre Claude Code une fois, ça renouvelle la connexion. Ensuite clique sur Rafraîchir dans le panneau.
</details>

<details>
<summary><b>« Identifiants Claude Code introuvables »</b></summary>
<br />
Claude Code n'est pas connecté sur ce PC. Dans un terminal, tape <code>claude</code>, puis <code>/login</code>.
</details>

<details>
<summary><b>« Trop de requêtes »</b></summary>
<br />
Anthropic demande de lever le pied sur les requêtes. Attends quelques minutes, les chiffres reviennent tout seuls.
</details>

<details>
<summary><b>L'icône a disparu</b></summary>
<br />
Elle se cache sûrement derrière la flèche <code>^</code> à côté de l'horloge. Fais-la glisser dans la barre des tâches.
</details>

---

<details>
<summary>🛠️ <b>Pour bidouiller le code</b></summary>

<br />

Electron, electron-vite et TypeScript strict. Il faut Node 24+ et pnpm 10+.

```bash
pnpm install
pnpm dev          # lance l'app en mode développement
pnpm typecheck
pnpm lint
pnpm build:win    # génère l'installeur dans dist/
```

Pour publier une version : monte `version` dans `package.json`, lance `pnpm build:win`, puis joins à une release GitHub les trois fichiers de `dist/` (l'installeur `.exe`, son `.blockmap` et `latest.yml`). S'il en manque un, la mise à jour automatique ne verra pas la nouvelle version.

L'icône est dessinée dans `resources/icon.svg`. Si tu la modifies, `pnpm icon` régénère `resources/icon.ico`.

| Dossier              | Rôle                                                                           |
| -------------------- | ------------------------------------------------------------------------------ |
| `src/main`           | lecture de la connexion, appel à l'API, icône dynamique, panneau, mises à jour |
| `src/preload`        | pont entre l'app et le panneau                                                 |
| `src/renderer/panel` | interface du panneau                                                           |
| `src/shared`         | types et seuils de couleur partagés                                            |
| `scripts`            | génération de l'icône `.ico`                                                   |

</details>
