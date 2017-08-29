// @author brunoimbrizi / http://brunoimbrizi.com

precision highp float;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;
attribute vec3 offset;
attribute vec2 uv;
attribute vec4 orientation;
attribute vec3 scale;
attribute float alpha;
attribute vec4 edge;

varying vec2 vUv;
varying float vAlpha;

// edge.x and edge.y = left edge
// edge.z and edge.w = right edge
// i.e.
// x   y                    z   w
// |---|--------------------|---|
varying vec4 vEdge;

void main() {
	vec3 vPosition = position;
	vPosition *= scale;
	vec3 vcV = cross(orientation.xyz, vPosition);
	vPosition = vcV * (2.0 * orientation.w) + (cross(orientation.xyz, vcV) * 2.0 + vPosition);
	
	vUv = uv;
	vEdge = edge;
	vAlpha = alpha;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( offset + vPosition, 1.0 );
}
