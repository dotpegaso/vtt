export const PLOT_DIE_TYPE = 'dplot' as const

// Face order matches the die values 1–6 in your reference art:
// 1: Opportunity (2)   2: Opportunity (4)   3/4: blank   5/6: compass/heroic
const FACE_FILES = [
  'opportunity-2.png',
  'opportunity-4.png',
  'blank.png',
  'blank.png',
  'heroic.png',
  'heroic.png',
] as const

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// DiceBox instances aren't typed for this, so we reach in loosely.
type DiceBoxInternal = {
  DiceFactory: { constructor: { dice: Record<string, unknown> } }
}

let registered = false

export async function registerPlotDieType(box: unknown, assetBase = '/assets/dice-box/textures/plot/') {
  if (registered) return
  const b = box as DiceBoxInternal
  const cache = b.DiceFactory.constructor.dice

  if (cache[PLOT_DIE_TYPE]) {
    registered = true
    return
  }

  const faceImages = await Promise.all(FACE_FILES.map((f) => loadImage(assetBase + f)))

  cache[PLOT_DIE_TYPE] = {
    name: 'Cosmere Plot Die',
    type: PLOT_DIE_TYPE,
    shape: 'd6',      // reuse the standard cube geometry, mass, and physics
    scale: 1.2,       // matches the library's own d6 scale
    mass: 300,
    inertia: 13,
    font: 'Arial',
    color: '',
    values: [1, 2, 3, 4, 5, 6],
    valueMap: [],
    normals: [],
    display: 'values',
    system: 'd20',
    labels: ['', '', ...faceImages], // 2 reserved slots (base/bezel material) + 6 faces
  }

  registered = true
}
