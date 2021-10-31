"use strict";

let gl;
let resolution = 100;

function get_patch(xMin, xMax, zMin, zMax){
    patch = new Patch(xMin, xMax, zMin, zMax, resolution);
    let vertices = patch.getTriangleVertices();
    console.log(vertices);
    for (let i=0; i<vertices.length; i++){
        vertices[i] = vec3(vertices[i][0], vertices[i][1], patch.getPerlinNoise(vertices[i][0],vertices[i][1]));
    }
    return vertices;
}


window.onload = function init() {
    let canvas = document.getElementById( "gl-canvas" );
    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available" );

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    let program = initShaders( gl, "vertex-shader", "fragment-shader" );

    gl.enable(gl.DEPTH_TEST);  
    gl.useProgram( program );
    
    // vertices of the corners of the canvas
    let vertices = get_patch(-1, 1, -1, 1);

    // Load the data into the GPU and bind to shader variables.
    gl.bindBuffer( gl.ARRAY_BUFFER, gl.createBuffer() );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    let vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    render(vertices.length);
}

function render(len) {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.LINES, 0, len );
}