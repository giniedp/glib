# Texture Samplers

In open gl the texture resource and its sampler parameters are defined in the same object.
Thus the filtering method is always bound to a texture resource. If the same texture
must be filtered with different sampler parameters, the resource must be cloned and
assigned with a different parameter set.

In DirectX however, textures and sampler parameters are decoupled. Open gl
allowed the same by using the [https://www.khronos.org/opengl/wiki/Sampler_Object](Sampler Object)
extension.

Unfortunately there is no such extension for WebGL 1.0 but it is built into WebGL 2.0

For WebGL 2.0 gglib will store sampling parameters in dedicated WebGLSampler objects
which are separate from the WebGLTexture objects. Both objects are then
assigned to a texture unit upon rendering.

For WebGL 1.0 gglib will commit sampling parameters to a texture object when a
texture is used. It still allows you to use different filtering methods for the same
texture resource. However, a texture resource can not be used with multiple filtering
methods at the same time.
