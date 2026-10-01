export type Point = { x: number; y: number }
export type Ink = { width: number; height: number; strokes: Point[][] }
export function isInk(value: unknown): value is Ink {
  if (!value || typeof value !== 'object') return false
  const ink = value as Ink
  return Number.isFinite(ink.width) && ink.width > 0 && Number.isFinite(ink.height) && ink.height > 0
    && Array.isArray(ink.strokes) && ink.strokes.every(stroke => Array.isArray(stroke)
      && stroke.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y)))
}
