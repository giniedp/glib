module Glib.Render {
  export interface Step {
    setup:(manager:Manager)=>void
    render:(manager:Manager)=>void
    cleanup:(manager:Manager)=>void
  }
}
