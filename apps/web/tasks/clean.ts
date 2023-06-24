import del from "del"
import config from "../config"

export async function clean() {
  return del(config.dist).then((files) => {
    files.forEach((p) => console.log("removed", p))
  })
}
