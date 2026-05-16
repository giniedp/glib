Level data at: sharedassets/coatlicue/[LEVEL]

File structure

```
[LEVEL]
├─ regions
│  └─r_+[XX]_+[YY]
│    ├─ capitals
│    │  └─ [LAYER]
│    │     └─ [LAYER].capitals.json
│    │     └─ [LAYER].metadata
│    ├─ impostors                  // impostor cell model, referenced by impostors.json
│    │  ├─ impostor_0.cgf          // 256 impostor cells per region, 16x16 grid,
│    │  ├─ impostor_0.cgfheap      // each cell is 128m x 128m covering 2048m x 2.048m region
│    │  ├─ ...
│    │  ├─ impostor_255.cgf
│    │  └─ impostor_255.cgfheap
│    ├─ poi_impostors              //
│    │  ├─ impostor_0.cgf          // 256 impostor cells per region, 16x16 grid,
│    │  ├─ impostor_0.cgfheap      // each cell is 128m x 128m covering 2048m x 2.048m region
│    │  ├─ ...
│    │  ├─ impostor_255.cgf
│    │  └─ impostor_255.cgfheap
│    ├─ localmappings.json
│    ├─ mapsettings.json
│    ├─ impostors.json      // trees and bushes
│    ├─ poi_impostors.json  // rocks and structures
│    ├─ region.chunks       // present in open world, quad tree chunks
│    ├─ region.dstribution  // distribution data for gatherables and vegetation
│    ├─ region.heightmap    // 16-bit single channel tiff
│    ├─ region.tractmap.tif // rgba color
│    ├─ region.vegetation
│    └─ region.waterqt      // water quadtree
├─ offlineoptions.json
├─ playable.json            // list of playable regions, each region is [Y, X]
├─ terrain.json
└─ tracts.json
```

## `impostors.json` and `poi_impostors.json`

- poi_impostors: rocks and structures
- impostors: trees and bushes

```json
{
  "materialAssetID": "",
  "impostors": [
    {
      "cellIndex": 0,
      "meshAssetID": "{D46366CA-BD6A-5CBE-8722-E3D7E067ED37}", // directly references the .cgf asset file in impostors/
      "worldPosition": {
        "x": 64.0,
        "y": 64.0
      }
    }
    // ...
  ]
}
```

## `offlineoptions.json`

```json
{
  "distributionBakeSeed": 93016, // unsure for what the seed is
  "distributionDataEnabled": true, // enables region.distribution
  "vegetationDataEnabled": true, // enables region.vegetation

  "streaming": {
    "impostorCellEdgeLength": 128,
    "regionChunksEnabled": true // enables region.chunks
  }
}
```

## `playable.json`

```json
[
  [0, 0] // region address [Y, X]
]
```

## `terrain.json`

```json
{
  "generatorType": "Heightmap",
  "heightCrop": 0.0,
  "mountainRoughness": 0.699999988079071,
  "mountainHeight": 2048.0,
  "snowMinimumSlope": 0.0,
  "snowStartHeight": 100.0,
  "valleyIntensity": 0.1694214940071106,
  "oceanLevel": 40.0,
  "worldMaterialAssetPath": "Materials/terrain/NW_OPR_004_Trench/NW_OPR_004_Trench.worldmat"
}
```

## `region.distribution`

Binary data

```json
{
  "region": [0, 0], // [Y, X]
  "slices": [
    "",
    "gatherables/master_bush",
    "gatherables/master_bush"
    // ...
  ],
  "variants": [
    "",
    "Bush_WaxMyrtle_a",
    "Bush_WaxMyrtle_b"
    // ...
  ],
  "indices": [
    723, 711, 712
    // ...
  ],
  "positions": [
    [49967, 60559],
    [49743, 60543],
    [50055, 60743]
    // ...
  ],
  // not sure what these are, we ignore them
  "positions2": [],
  "types2": "",
  "positions3": [],
  "types3": ""
}
```

```json
{
  "__type": "AoiComponent",
  "baseclass1": {
    "__type": "FacetedComponent",
    "baseclass1": {
      "__type": "AZ::Component",
      "id": "12556981330868048132"
    },
    "m_replicationindex": 0
  },
  "m_aoigridcategory": 6,
  "m_aoiradius": 0,
  "m_slicephysicalgridradius": 0.20000000298023224,
  "m_slicedetectiongridradius": 0,
  "m_slicephysicalradius": 0,
  "m_additionalslicephysicalminradius": 0,
  "m_isstaticslice": true,
  "m_slicetags": 0,
  "m_slicespawnradius": 2083.581298828125,
  "m_useuserdefinedspawnradius": false,
  "m_overridewithuserdefinedspawnradius": false,
  "m_editorsliceviewradius": 0,
  "m_editorslicephysicalradius": 0,
  "m_editorslicespawnradius": 0,
  "m_editoraoiradius": 0,
  "m_editorisstaticslice": false,
  "m_editorwillimpostor ": false,
  "m_editorisrequiredonserver": false,
  "m_editorrefreshbutton": false
},
```

## Server routes

- `/list/[PATH]` - lists files in the given path, accepts glob pattern e.g. `/list/**.datasheet`
- `/file/[PATH]` - retrieves the file at the given asset path
- `/models` - serves previously converted models, used for nw-buddy local viewer
- `/catalog` - serves the catalog as JSON (DON'T do it, too large)
- `/catalog/[ASSET_ID]` - retrieves metadata for the given asset id, including referenced assets
- `/level` Level data router

## Level Routes

- `/level` - lists available level names
- `/level/[NAME]` - gets level info
- `/level/[NAME]/mission`
- `/level/[NAME]/heightmap`
- `/level/[NAME]/heightmap/{z}_{y}_{x}.png` - heightmap tile for address

## Open World Chunks

```json
{
  "__type": "AC608BE6-77F3-5AF5-A7A9-607621389D91",
  "chunks": {
    "__type": "283F62D6-A310-5D1E-A38E-409DB6C165A4",
    "element": [
      {
        "__type": "ChunkEntry",
        "cellindex": {
          "__type": "CellIndex",
          "x": "1",
          "y": "1",
          "z": "0"
        },
        "size": "1024",
        "spawnradius": 0,
        "layer": "03GC03_MtnEdge_AI_Group",
        "worldposition": [7680, 7680, 534.8202514648438],
        "chunktype": 0,
        "assetid": {
          "__type": "AssetId",
          "guid": "7b52fa13-bc01-5bc6-9e1c-a83bcf6eb259",
          "subid": 2995559734
        }
      }
    ]
  }
}
```

`assetid.guid` + `assetid.subid` references a dynamic slice to load within that chunk

Slice Spawn Radius is definde inside the slice at AoiComponent.m_slicespawnradius

Individual renderable meshes also have a max view distance

Let me look at the GDE/AOI streaming consumer of SliceMetaData to lock in the intent.

Done. Here's the consolidated answer.

## Sibling GDE cvars — default values

Pulled from the registration block at `0x7ff7f00e8cf0` (single function, all called via the AZ console). Defaults read from the immediates passed to the registrar:

| cvar                                        | type  | default    | notes / code path                                                               |
| ------------------------------------------- | ----- | ---------- | ------------------------------------------------------------------------------- |
| `g_GDE_ImpostorsRenderMaxRange`             | float | **1000.0** | clamped at runtime to ≤ **1500.0** (`0x7ff7f146bf78`); read at `0x7ff7efe7fde0` |
| `g_GDE_GeomsCreatedPerFrame`                | int   | **25**     |                                                                                 |
| `g_GDE_GeomsDeletedPerFrame`                | int   | **50**     |                                                                                 |
| `g_GDE_SlicesCreatedPerFrame`               | int   | **10**     |                                                                                 |
| `g_GDE_GeomsCreatedPerFrameMaxTimeInMs`     | float | **0.5**    |                                                                                 |
| `g_GDE_GeomsDeletedPerFrameMaxTimeInMs`     | float | **0.25**   |                                                                                 |
| `g_GDE_SlicesCreatedPerFrameMaxTimeInMs`    | float | **0.5**    |                                                                                 |
| `g_GDE_ImpostorsCreatedPerFrameMaxTimeInMs` | float | **0.25**   |                                                                                 |
| `g_GDE_ImpostorMeshMemoryBudgetMBs`         | float | **700.0**  | converted to bytes (`*1024²`) at runtime                                        |
| `g_GDE_AOIScale`                            | float | **1.0**    | clamped to **[0.1, 1.0]** at runtime                                            |
| `g_GDE_PausedReplicationLimit`              | int   | **200**    | (slightly outside the GDE block)                                                |

## nw-extract validation of the impostor cell grid

`assets\SharedDataStrm-part4.pak :: sharedassets/coatlicue/newworld_vitaeeterna/offlineoptions.json`:

```json
{
  "distributionDataEnabled": true,
  "distributionBakeSeed": 93016,
  "vegetationDataEnabled": true,
  "streaming": {
    "impostorCellEdgeLength": 128,
    "regionChunksEnabled": true
  }
}
```

Exactly the field that `Coatlicue::WorldConfig::ParseJson` (sub-block `0x7ff7efedd450`) consumes — so the **128** in your estimate is real and authored, not hardcoded.

A real `impostors.json` (`r_+01_+02`) confirms the schema:

```json
{
  "materialAssetID": "",
  "impostors": [
    { "cellIndex": 17, "meshAssetID": "{425A9223-...}", "worldPosition": { "x": 2240.0, "y": 4288.0 } },
    { "cellIndex": 18, "meshAssetID": "{32E44C74-...}", "worldPosition": { "x": 2368.0, "y": 4288.0 } },
    ...
  ]
}
```

Region origin = `(1*2048, 2*2048) = (2048, 4096)`. cellIndex 17 → row 1, col 1 in the 16×16 grid. Center of that cell = `(2048 + 1*128 + 64, 4096 + 1*128 + 64) = (2240, 4288)`. ✔ matches exactly. So:

- 1 region = 2048×2048 units
- region split into a **16×16 grid** of cells, `cellIndex = row*16 + col`
- 1 cell = **128×128** units, `worldPosition` = cell center
- **No per-cell visibility distance** in the data — purely the global `g_GDE_ImpostorsRenderMaxRange` (1000 default, 1500 clamp).

## AoiComponent fields — intent, recovered from Ghidra

The decisive piece I missed last round: the **runtime baked slice descriptor** is a separate type. Its Reflect lives at `0x7ff7eac8dda0` — `SliceMetaData::Reflect`, UUID `{7D314916-0502-4D0C-B457-AE485E62A156}`. Its fields are short, non-`m_` names, and they map 1-to-1 onto the AoiComponent ones with revealing semantics:

| AoiComponent (authoring, offset)                    | SliceMetaData (baked, offset)               | What the field is for                                                                                                                                                                                                                                              |
| --------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `m_aoiGridCategory` (0x98, u32 enum)                | `gridCategory` (0x24, u16 enum)             | Which AOI spatial grid this slice lives in. `4 = Infinity Grid` is special-cased; the validator at `0x7ff7eacde5c0` rejects ~12 component types when this is set.                                                                                                  |
| `m_aoiRadius` (0x9c, float)                         | `aoiDistance` (0x0c, float)                 | The AOI **subscription bubble** — how close an entity has to be before it gets entity events / proximity-driven replication for this slice.                                                                                                                        |
| `m_sliceSpawnRadius` (0xa0, float)                  | `gdeSpawnRadius` (0x1c, float)              | **Geometry Distribution Engine** spawn distance. When the camera is within this distance, GDE pages the slice's geometry in. This is the field bound to the runtime impostor↔geometry switch.                                                                      |
| `m_slicePhysicalGridRadius` (0xa4, float)           | `gridRegistrationRadius` (0x20, float)      | The radius the slice **registers itself with** on the AOI grid — i.e. the size of its presence on the spatial index, so other queries can find it. Typically derived from mesh root-relative bounds. (Your example: `92.97`, matching a fairly small mesh extent.) |
| `m_sliceDetectionGridRadius` (0xa8, float)          | (no SliceMetaData equivalent)               | Editor-only / pre-bake. Used for proximity-detection contracts (e.g. LandClaim/contract triggers) before bake clamps it. In your JSON it's 0 = unused.                                                                                                             |
| `m_slicePhysicalRadius` (0xac, float)               | `slicePhysicalRadius` (0x08, float)         | **Physics activation radius**. Geometry within this is given collision / physics simulation.                                                                                                                                                                       |
| `m_additionalSlicePhysicalMinRadius` (0xb0, float)  | (no SliceMetaData equivalent)               | Bake-time **min-clamp** added to `slicePhysicalRadius` so the physical bubble is never smaller than this.                                                                                                                                                          |
| `m_isStaticSlice` (0xb4, bool)                      | `isStaticSlice` (0x26, bool)                | Slice never moves → enables aggressive culling & one-shot replication.                                                                                                                                                                                             |
| `m_useUserDefinedSpawnRadius` (0xb5, bool)          | `usesCustomDefinedSpawnRadius` (0x2d, bool) | If true, the baker copies `m_editorSliceSpawnRadius` into runtime `gdeSpawnRadius`; if false, it computes from mesh bounds.                                                                                                                                        |
| `m_overrideWithUserDefinedSpawnRadius` (0xb6, bool) | (no equivalent — bake-only)                 | Forces the user value to win even when the auto-computation suggests otherwise.                                                                                                                                                                                    |
| `m_sliceTags` (0xb8, u32 bitset)                    | `sliceTags` (0x14, u32)                     | Filter bits used by the streaming/AOI subsystem.                                                                                                                                                                                                                   |
| `m_ignoresGridFilter` (0x980, bool)                 | (separate sub-object — third reflect block) | Belongs to a different aggregate; unrelated to the slice radii.                                                                                                                                                                                                    |

Additional flags only in `SliceMetaData` (set by the baker, not directly editable on AoiComponent):

- `hasCollision` (0x27)
- `isRequiredOnServer` (0x28) — server must keep it loaded regardless of streaming
- `forceWaitReplicatedData` (0x29)
- `isLongDistanceGDE` (0x2a) — flag for the long-range GDE pass
- `skipMidRangeImpostors` (0x2b) — slice has no mid-geo impostor mesh
- `spawnInInstances` (0x2c)
- `prioritizeGDEWhenMounted` (0x2e) — GDE prioritises this when the player is mounted (faster locomotion → bigger streaming horizon)
- `phasingRestriction` (0x18) — phase visibility filter
- `meshes` (0x30) — vector of `SliceMetaDataMeshEntry` (each with `maxViewDistance`, `m_impostorFarDistance`, `lodRatio`, `meshOptionsBitset`)
- `spawners` (0x50), `childSpawnSliceIds` (0x70)

### How to read the JSON example you posted

```
m_aoigridcategory: 6                       // grid bucket #6 (not InfinityGrid)
m_sliceSpawnRadius: 1200.51                // GDE spawn distance — geometry pages in 1200u from camera
m_slicePhysicalGridRadius: 92.97           // baked AOI grid registration radius (≈ mesh root extent)
m_slicePhysicalRadius: 0                   // no extra physics-only override; bake left it at 0
m_aoiRadius: 0                             // no event-AOI bubble
m_sliceDetectionGridRadius: 0              // no detection bucket
m_additionalSlicePhysicalMinRadius: 0      // no min-clamp added
m_isStaticSlice: true                      // doesn't move
m_useUserDefinedSpawnRadius: true          // → spawn radius copied from editor value
m_overrideWithUserDefinedSpawnRadius: false
m_sliceTags: 0
m_editorSliceSpawnRadius: 1200.51          // designer-typed value (matches m_sliceSpawnRadius ✓)
m_editorSlicePhysicalRadius: 200.51        // designer-typed value (NOT in runtime — bake didn't take it)
m_editorSliceViewRadius: 1000              // editor-only preview radius
m_editorWillImpostor: false                // designer hint to the impostor baker
m_editorIsRequiredOnServer: true           // → bakes into isRequiredOnServer
```

So the "fields that don't make sense" cluster has a clean explanation: **AoiComponent is the authoring component; the runtime answer lives in `SliceMetaData`** which the slice cooker writes. The `m_editor*` fields are designer inputs, the non-`m_editor*` ones are the baked values that may differ if the cooker overrode them, and the four named "grid radii" are different concepts (subscription bubble vs GDE spawn vs grid-registration vs physics activation), only one of which is replicated to the server.
