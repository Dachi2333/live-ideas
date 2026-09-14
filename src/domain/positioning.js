const COLUMNS = 4;
const SPACING = 320;

export function getStickyPosition(index) {
  if (!Number.isInteger(index) || index < 0) throw new Error("invalid_position_index");
  return {
    x: (index % COLUMNS) * SPACING,
    y: Math.floor(index / COLUMNS) * SPACING,
  };
}
