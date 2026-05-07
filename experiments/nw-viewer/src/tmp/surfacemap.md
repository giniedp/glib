**16-byte LE header**, then string block, then splat block:

|    off | size | field                                    |
| -----: | :--: | ---------------------------------------- |
| `0x00` |  u8  | `version` (always `0x02`)                |
| `0x01` |  u8  | `material_count`                         |
| `0x02` | u16  | `layer_id_bits` (`1` trivial / `3` full) |
| `0x04` | u32  | `grid_dim` (`0` trivial / `1024` full)   |
| `0x08` | u32  | `data_size` bytes                        |
| `0x0c` | u32  | `strings_size` bytes                     |

- **Strings block:** `\n`-separated UTF-8 material names; index in this list = layer id used by the splat block.
- **Splat block (full tiles only):** `1024×1024` cells, **6 bits/cell**, LE-packed (4 cells per 24-bit word, lowest cell at low bits). Each cell is `(primary << 3) | secondary` — both 3-bit indices into `materials[]`. Sentinel `7` = "no layer in this slot."
- **Trivial tiles** (`grid_dim == 0`): the whole region is just `materials[0]`. That's how `default-regionmaterial.surfacemap` (28 B, `mat_default`) and most `jav_newworld_vitaeeterna_*` tiles ship.
