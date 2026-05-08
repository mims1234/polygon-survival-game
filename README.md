# Wildlands

A grid-based, top-down survival and base-building game set in an endless procedurally generated world. Gather scarce resources, survive the cold, build an automated economy, and grow your empire from a lonely campfire to a thriving trade hub.

## Features

- **Procedural Exploration**: Discover endless 20×20 regions with fog-of-war. Each region has unique biome layouts — some are wood-rich, others stone-rich. Walk to the map edge to travel to new lands.
- **Survival Mechanics**: Manage **Stamina**, **Hunger**, and **Temperature**. Stay near a **Campfire** or **Bonfire** to avoid freezing to death at night. Build **Shelters** and **Cabins** to slow hunger drain and boost stamina regeneration.
- **Resource Scarcity**: Resources are limited and respawn very slowly (3–10 minutes). You must explore new regions when local supplies run out.
- **Tool Upgrades**: Upgrade your tools in three tiers. Tier I starts basic, Tier II (requires **Forge**) doubles yield and speed, and Tier III (requires **Blast Furnace**) triples yield with minimal stamina cost.
- **Building Upgrades**: Every production building can be upgraded once for better output, unique visuals, and stronger effects. Upgrades cost **Coins**, giving them a real purpose in the economy.
- **Automation Economy**: Build Lumber Camps, Quarries, Wells, Farms, and Workshops that produce resources automatically. Most consume fuel (food, wood, or water) to run. Wells operate for free.
- **Crafting System**: Craft Planks, Ingots (at a Forge), and Coins (at a Market). A Blast Furnace enables cheaper ingot smelting and bulk coin minting at a Trade Hub.
- **Storage System**: Start with only **10 capacity**. Build Campfires, Shelters, and Cabins to expand your storage.
- **Progression & Levels**: Gain XP by gathering, crafting, building, exploring, and upgrading. Level up to unlock new buildings and expand your capabilities.
- **Victory Condition**: Build a **Market** to open trade routes. Upgrade it to a **Trade Hub** for better deals and bulk production.

## Technology Stack

Built with **HTML5**, **CSS3**, and **JavaScript ES Modules**, using **[Three.js](https://threejs.org/)** for 3D rendering, animations, fog-of-war, and the procedural world grid.

## Getting Started

To run the game locally, any standard local web server will work:

1. Clone the repository:
   ```bash
   git clone https://github.com/mims1234/polygon-survival-game.git
   ```
2. Navigate into the project directory:
   ```bash
   cd polygon-survival-game
   ```
3. Start a local web server (e.g., VS Code **Live Server** extension, or Python's built-in server):
   ```bash
   python -m http.server 8000
   ```
4. Open `http://localhost:8000` in your browser.

> **Note:** The game uses ES Modules and `localStorage` for saves. A local server is required — opening `index.html` directly from the file system will not work.

## Controls

| Key | Action |
|-----|--------|
| **1** | Select Hand (gather food) |
| **2** | Select Axe (chop wood) |
| **3** | Select Pickaxe (mine stone) |
| **4** | Select Bucket (collect water) |
| **5** | Select Build Mode |
| **M** | Toggle World Map |
| **H** | Open Help / Instructions |
| **Escape** | Close Map overlay |
| **Left Click** | Move to tile / gather / build |

## Quick Start Guide

1. **Build a Campfire first.** The cold will kill you in 1 hour without warmth.
2. **Gather basics** — wood, stone, food, water.
3. **Build a Shelter** for storage and hunger reduction.
4. **Build a Well** early — it's the only free automation.
5. **Explore new regions** when resources run low. Each first visit gives +30 XP.
6. **Build a Forge** to unlock Tier II tools and Ingots.
7. **Build a Market** to mint Coins and unlock trade.
8. **Upgrade buildings** with Coins to boost your economy.
9. **Build a Blast Furnace** to unlock Tier III tools and cheaper crafting.

## Save System

Progress is saved automatically every 5 seconds to your browser's `localStorage`. The game tracks your inventory, buildings, discovered regions, tool upgrades, and survival stats across sessions.

## License

This project is open source and available under the MIT License.
