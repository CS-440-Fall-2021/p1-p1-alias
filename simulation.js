"use strict";

let gl;
let resolution = 200;
let perlin_density = 20;
let near = 0.0;
let left = 0.0;
let up = 3.0;
let fovy = 60.0;  // Field-of-view in Y direction angle (in degrees)
let aspect;       // Viewport aspect ratio

let mvMatrix, pMatrix;
let modelView, projection;

function get_patch(xMin, xMax, zMin, zMax) {
    patch = new Patch(xMin, xMax, zMin, zMax, resolution);
    let vertices = patch.getTriangleVertices();
    for (let i = 0; i < vertices.length; i++) {
        vertices[i] = vec3(vertices[i][0], patch.getPerlinNoise(vertices[i][0], vertices[i][1], perlin_density)-1, vertices[i][1]);
    }
    return vertices;
}


window.onload = function init() {
    let canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //  Load shaders and initialize attribute buffers
    let program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    gl.useProgram(program);

    // vertices of the corners of the canvas
    let vertices = get_patch(-10, 10, -10, 10);

    // Load the data into the GPU and bind to shader variables.
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    window.onkeydown = function (event) {
        var key = String.fromCharCode(event.keyCode);
        switch (key) {
            case '1':
                left+=0.1;
                render(vertices.length);
                break;
            case '2':
                left-=0.1;
                render(vertices.length);
                break;
            case '3':
                up+=0.1;
                render(vertices.length);
                break;
            case '4':
                up-=0.1;
                render(vertices.length);
                break;
            case '5':
                near-=0.1;
                render(vertices.length);
                break;
            case '6':
                near+=0.1;
                render(vertices.length);
                break;
        }
    };
   
    render(vertices.length);

    function render(len) {
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        let eye=vec3(left,up,near);
        let at = vec3(0, -1, -5);
        let lookup = vec3(0, 5, -1);
        let lookat = lookAt(eye, at, lookup);
        // let perspect = perspective(60, 1, near-2, near-10);
        let mat = mult(lookat, perspect);
        let perp = gl.getUniformLocation(program, "perp");
        gl.uniformMatrix4fv(perp, false, flatten(mat));
        gl.drawArrays(gl.LINES, 0, len);
    }
}