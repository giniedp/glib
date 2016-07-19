precision highp float;
precision highp int;

// @binding position
attribute vec3 position;

// @binding texture
attribute vec2 texture;

// @binding texture
uniform sampler2D textureSampler;

// @binding targetWidth
uniform float targetWidth;

// @binding targetHeight
uniform float targetHeight;

varying vec2 texCoord;
