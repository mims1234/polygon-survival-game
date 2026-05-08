export const TOOLS = [
  { id: "hand", label: "Hand" },
  { id: "axe", label: "Axe" },
  { id: "pickaxe", label: "Pickaxe" },
  { id: "bucket", label: "Bucket" },
  { id: "build", label: "Build" },
];

export const TOOL_LABELS = {
  hand: "Hand",
  axe: "Axe",
  pickaxe: "Pickaxe",
  bucket: "Bucket",
  build: "Build",
};

export function isBuildTool(toolId) {
  return toolId === "build";
}

export function toolTier(upgradedTools, toolId) {
  if (upgradedTools?.[toolId] === 3) return 3;
  if (upgradedTools?.[toolId] === 2) return 2;
  return 1;
}

export function tierLabel(tier) {
  if (tier === 3) return "III";
  if (tier === 2) return "II";
  return "";
}
