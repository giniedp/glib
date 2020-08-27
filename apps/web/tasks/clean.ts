import del from "del"
import manifest from "../manifest"

export async function clean() {
  return del(manifest.dist).then((files) => {
    files.forEach((p) => console.log("removed", p))
  })
}
