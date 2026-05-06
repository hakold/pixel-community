# Action Scene Bar Plan

## Current Progress

- Right-side chat panel has replaced the old bottom chat area.
- Bottom area is now reserved for the action scene bar and will be the only primary surface for挂机表现.
- Backend remains the source of truth for the player's single active action.
- Frontend is responsible for scene presentation only.

## Agreed Direction

### Backend

- Backend does **not** need fine-grained scene phases for study/mining/fishing/work/woodcut.
- Backend only needs to maintain one active main action at a time.
- The current action payload is enough for the first version:
  - `actionType`
  - `actionName`
  - `startTime`
  - `duration`
  - `remaining`
  - `progress`
  - `isComplete`

### Frontend

- Frontend drives the scene bar as a presentation layer.
- Scene progress is derived locally from backend `startTime + duration`.
- The actor can move every frame.
- Small visual drift is acceptable.
- Sync strategy for the first implementation:
  - local frame-by-frame progress rendering
  - low-frequency polling from backend
  - extra sync when progress crosses major milestones

## First Landing Scope

1. Remove the old left-side挂机任务 card to avoid duplicated information.
2. Keep only one bottom action scene bar for挂机表现.
3. Make the bottom bar feel more like a pixel scene:
   - clearer ground
   - stronger scene layers
   - visible finish marker
   - richer action-type-specific color themes
4. Keep the current version focused on挂机 scenes only.
5. Battle scene is only recorded for now and is not implemented in this round.

## Frontend Runtime Plan

### Local Progress

- Use local `Date.now()` per frame.
- Derive visual progress from:

```txt
progress = (now - startTime) / duration
```

- Clamp to `[0, 1]`.

### Sync Plan

- Keep backend sync as a safety correction layer.
- First version sync rules:
  - poll backend every 5 seconds
  - sync again when progress crosses 25%, 50%, 75%, 100%
  - sync when page regains focus

### Presentation State

- Backend does not store these.
- Frontend uses local presentation-only states such as:
  - pose
  - variant
  - scene theme
  - idle/running/complete visual mode

## Asset Spec Proposal

Resources should live under:

```txt
client/src/assets/action-scenes/
```

Recommended structure:

```txt
client/src/assets/action-scenes/
  shared/
    ui/
    ground/
    finish/
  study/
    bg/
    actor/
    props/
  mining/
    bg/
    actor/
    props/
  woodcut/
    bg/
    actor/
    props/
  fishing/
    bg/
    actor/
    props/
  work/
    bg/
    actor/
    props/
  battle/
    bg/
    actor-self/
    actor-target/
    fx/
```

## Asset Size Recommendations

### Actor Sprite

- Frame size: `32x32 px`
- Direction for挂机 bar: side view
- Transparent PNG sprite sheet
- Recommended frame count per action pose:
  - idle: 4 frames
  - move/walk: 6 frames
  - action loop: 4 to 6 frames
  - complete/celebrate: 4 frames

### Props

- Small props: `16x16 px`
- Medium props: `32x32 px`
- Large props: `48x48 px`

### Background Layers

- Build by layers instead of one flattened image when possible:
  - far background
  - mid scene props
  - ground strip
  - finish marker
- If exported as raster strips, recommend a baseline authoring size around:
  - background strip: `960x96 px`
  - ground strip: `960x32 px`

## Required Action Resources Per挂机 Type

### Study

- classroom background
- desk/book props
- actor poses:
  - walk
  - read
  - write
  - complete

### Mining

- mine tunnel / ore wall background
- ore pile / rock props
- actor poses:
  - walk
  - swing pickaxe
  - inspect ore
  - complete

### Fishing

- pond / riverbank background
- float / bucket / water props
- actor poses:
  - walk
  - cast
  - wait
  - pull
  - complete

### Woodcut

- forest background
- stump / log props
- actor poses:
  - walk
  - chop
  - lift wood
  - complete

### Work

- workshop / office background
- desk / crate / machine props
- actor poses:
  - walk
  - operate
  - carry
  - complete

## Battle Scene Record Only

- Battle uses the same bottom component container in the future.
- Battle does not use the挂机 single-track presentation.
- Planned battle staging:
  - self actor enters from left
  - target enters from right
  - both meet in the middle
  - 30-second presentation window
  - backend only returns final result

## Next Steps

1. Finish the first挂机 scene bar implementation with CSS placeholder art.
2. Replace placeholder actor and scenery with pixel resources later.
3. Split the bottom bar into a dedicated component once the挂机 and battle templates both exist.
