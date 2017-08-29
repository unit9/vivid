// @author brunoimbrizi / http://brunoimbrizi.com

precision highp float;

uniform sampler2D map;
uniform float hueAdjust;

varying vec2 vUv;
varying vec4 vEdge;
varying float vAlpha;

vec4 hueShift(in vec4 color) {
	const vec4  kRGBToYPrime = vec4 (0.299, 0.587, 0.114, 0.0);
	const vec4  kRGBToI     = vec4 (0.596, -0.275, -0.321, 0.0);
	const vec4  kRGBToQ     = vec4 (0.212, -0.523, 0.311, 0.0);

	const vec4  kYIQToR   = vec4 (1.0, 0.956, 0.621, 0.0);
	const vec4  kYIQToG   = vec4 (1.0, -0.272, -0.647, 0.0);
	const vec4  kYIQToB   = vec4 (1.0, -1.107, 1.704, 0.0);

	// Convert to YIQ
	float YPrime = dot(color, kRGBToYPrime);
	float I = dot(color, kRGBToI);
	float Q = dot(color, kRGBToQ);

	// Calculate the hue and chroma
	float hue = atan(Q, I);
	float chroma = sqrt(I * I + Q * Q);

	// Make the user's adjustments
	hue += hueAdjust;

	// Convert back to YIQ
	Q = chroma * sin(hue);
	I = chroma * cos(hue);

	// Convert back to RGB
	vec3 RGB = vec3(0.0);
	vec4 yIQ = vec4(YPrime, I, Q, 0.0);
	RGB.r = dot(yIQ, kYIQToR);
	RGB.g = dot(yIQ, kYIQToG);
	RGB.b = dot(yIQ, kYIQToB);

	return vec4(RGB.rgb, color.a);
}

void main() {
	vec2 uv = vUv;

	vec4 texel = texture2D(map, uv);

	vec4 color = texel;
	
	float alphaA = smoothstep(vEdge.x, vEdge.y, uv.x);
	float alphaB = smoothstep(vEdge.w, vEdge.z, uv.x);
	float alphaMix = min(alphaA, alphaB);
	color.a = min(color.a, alphaMix) * vAlpha;

	// color = hueShift(color);

	gl_FragColor = color;
	// gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );

	// gl_FragColor = texture2D(map, uv);
}