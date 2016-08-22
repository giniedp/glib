module Glib.Content.Pipeline {

  loader('*', 'Texture', function(context: Context) {
    context.intermediate = { data: context.path }
    return context.manager.process(context) // skips the importer stage
  })
  processor('Texture', function(context: Context) {
    context.result = context.manager.device.createTexture(context.intermediate)
  })

  loader('*', 'Texture2D', function(context: Context) {
    context.intermediate = { data: context.path }
    return context.manager.process(context) // skips the importer stage
  })
  processor('Texture2D', function(context: Context) {
    context.result = context.manager.device.createTexture2D(context.intermediate)
  })

  loader('*', 'TextureCube', function(context: Context) {
    context.intermediate = { data: context.path }
    return context.manager.process(context) // skips the importer stage
  })
  processor('TextureCube', function(context: Context) {
    context.result = context.manager.device.createTextureCube(context.intermediate)
  })

  loader('*', 'Image', function (context:Context) {
    let image = new Image()
    image.src = context.path
    context.result = image
    // skips the importer and processor stages
  })
  loader('*', 'Video', function (context:Context) {
    let video = document.createElement('video')
    video.src = context.path
    context.result = video
    // skips the importer and processor stages
  })

  loader('*', 'ImageData', function(context:Context) {
    let deferred = Promise.deferred()
    let image = new Image()
    image.onload = function() { 
      context.intermediate = image
      deferred.resolve(context.manager.process(context)) 
    }
    image.onabort = function (e) { deferred.reject(e) }
    image.src = context.path
    return deferred.promise
  })
  processor('ImageData', function(context:Context) {
    context.result = getImageData(context.intermediate)
  })

  let canvas: HTMLCanvasElement
  let canvasContext2d: CanvasRenderingContext2D
  function getImageData(image:HTMLImageElement, width?:number, height?:number): ImageData{
    if (!image.complete){
      throw new Error('image must be completed') 
    }
    canvas = canvas || document.createElement('canvas')
    canvas.width = width || image.naturalWidth
    canvas.height = height || image.naturalHeight

    canvasContext2d = canvasContext2d || canvas.getContext("2d")
    canvasContext2d.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvasContext2d.getImageData(0, 0, canvas.width, canvas.height)
  }

}
