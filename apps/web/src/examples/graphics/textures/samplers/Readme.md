## Texture Samplers

In open gl the texture resource and its sampler parameters are declared on the same object
so that a texture resource is always bound to its filtering method.
If we wanted to use the same texture with different filtering methods in the same draw call
then usually the resource must be cloned and assigned with a different parameter set.

In DirectX textures and sampler parameters are decoupled. Open gl
allowed the same by using the [https://www.khronos.org/opengl/wiki/Sampler_Object](Sampler Object)
extension.

Unfortunately there is no such extension for WebGL 1.0 but it is built into WebGL 2.0

For WebGL 2.0 gglib will store sampling parameters in dedicated WebGLSampler objects
which are separate from the WebGLTexture objects. Both objects are then
assigned to a texture unit upon rendering.

For WebGL 1.0 gglib will commit sampling parameters to a texture object when a
texture is used. It still allows you to use different filtering methods for the same
texture resource. However, a texture resource can not be rendered with different filtering
methods at the same time.
