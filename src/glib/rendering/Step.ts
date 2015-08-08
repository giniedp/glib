module Glib.Rendering {
  export interface Step {
    setup:(context:Context)=>void
    render:(context:Context)=>void
    cleanup:(context:Context)=>void
  }
}