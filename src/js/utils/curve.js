import { Vector3, Matrix4 } from 'three';
import { clamp } from './math';

const computeFrenetFrames = (curve, segments) => {

	// from Three.js extras/core/Curve
	// https://github.com/mrdoob/three.js/blob/master/src/extras/core/Curve.js

	// see http://www.cs.indiana.edu/pub/techreports/TR425.pdf

	var normal = new Vector3();

	var tangents = [];
	var normals = [];
	var binormals = [];

	var vec = new Vector3();
	var mat = new Matrix4();

	var i, u, theta;

	// compute the tangent vectors for each segment on the curve

	for ( i = 0; i <= segments; i ++ ) {

		u = i / segments;

		tangents[ i ] = curve.getTangentAt( u );
		tangents[ i ].normalize();

	}

	// select an initial normal vector perpendicular to the first tangent vector,
	// and in the direction of the minimum tangent xyz component

	normals[ 0 ] = new Vector3();
	binormals[ 0 ] = new Vector3();

	/*
	var min = Number.MAX_VALUE;
	var tx = Math.abs( tangents[ 0 ].x );
	var ty = Math.abs( tangents[ 0 ].y );
	var tz = Math.abs( tangents[ 0 ].z );

	if ( tx <= min ) {

		min = tx;
		normal.set( 1, 0, 0 );

	}

	if ( ty <= min ) {

		min = ty;
		normal.set( 0, 1, 0 );

	}

	if ( tz <= min ) {

		normal.set( 0, 0, 1 );

	}
	*/
	
	normal.set(1, 0, 0);

	vec.crossVectors( tangents[ 0 ], normal ).normalize();

	normals[ 0 ].crossVectors( tangents[ 0 ], vec );
	binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] );


	// compute the slowly-varying normal and binormal vectors for each segment on the curve

	for ( i = 1; i <= segments; i ++ ) {

		normals[ i ] = normals[ i - 1 ].clone();

		binormals[ i ] = binormals[ i - 1 ].clone();

		vec.crossVectors( tangents[ i - 1 ], tangents[ i ] );

		if ( vec.length() > Number.EPSILON ) {

			vec.normalize();

			theta = Math.acos( clamp( tangents[ i - 1 ].dot( tangents[ i ] ), - 1, 1 ) ); // clamp for floating pt errors

			normals[ i ].applyMatrix4( mat.makeRotationAxis( vec, theta ) );

		}

		binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

	}

	return {
		tangents: tangents,
		normals: normals,
		binormals: binormals
	};
};

export { computeFrenetFrames };