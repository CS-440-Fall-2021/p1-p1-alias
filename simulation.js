"use strict";

let gl;
let resolution = 200;
let perlin_density = 25;
let x = 0.0;
let y = 3.0;
let z = 0.0;
let pitch_val = 0;
let yaw_val = 0;
let left = 0;
let right = 0;
let top1 = 0;
let bottom = 0;
let near = 0;
let far = 0;
let fovy = 60.0; // Field-of-view in Y direction angle (in degrees)
let aspect; // Viewport aspect ratio

let mvMatrix, pMatrix;
let modelView, projection;

let viewMode = 1;

function get_patch(xMin, xMax, zMin, zMax) {
  patch = new Patch(xMin, xMax, zMin, zMax, resolution);
  let vertices = patch.getTriangleVertices();
  for (let i = 0; i < vertices.length; i++) {
    let [y, normal] = patch.getPerlinNoise(vertices[i][0], vertices[i][1], perlin_density);
    vertices[i] = vec3(
      vertices[i][0],
      y,
      vertices[i][1]
    );
  }
  return vertices;
}

window.onload = function init() {
  let canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext("webgl2");
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
      case "1":
        if (event.shiftKey) left += 0.1;
        else left -= 0.1;
        render(vertices.length);
        break;
      case "2":
        if (event.shiftKey) right -= 0.1;
        else right += 0.1;
        render(vertices.length);
        break;
      case "3":
        if (event.shiftKey) top1 -= 0.1;
        else top1 += 0.1;
        render(vertices.length);
        break;
      case "4":
        if (event.shiftKey) bottom += 0.1;
        else bottom -= 0.1;
        render(vertices.length);
        break;
      case "5":
        if (event.shiftKey) near -= 0.1;
        else near += 0.1;
        render(vertices.length);
        break;
      case "6":
        if (event.shiftKey) far += 0.1;
        else far -= 0.1;
        render(vertices.length);
        break;
      case "W":
        pitch_val+=0.1;
        render(vertices.length);
        break;
      case "S":
        pitch_val-=0.1;
        render(vertices.length);
        break;
      case "A":
        yaw_val-=0.1;
        render(vertices.length);
        break;
      case "D":
        yaw_val+=0.1;
        render(vertices.length);
        break;
      case 'V':
        if(viewMode==2) viewMode = 0;
        else viewMode++;
        render(vertices.length);
        break;
    }
  };

  render(vertices.length);

  function frustum(left, right, bottom, top, near, far) {
    if (left == right) {
      throw "frustum(): left and right are equal";
    }

    if (bottom == top) {
      throw "frustum(): bottom and top are equal";
    }

    if (near == far) {
      throw "frustum(): near and far are equal";
    }
    
    let w = right - left;
    let h = top - bottom;
    let d = far - near;

    let result = mat4();

    result[0][0] = (2.0 * near) / w;
    result[1][1] = (2.0 * near) / h;
    result[2][2] = -(far + near) / d;
    result[0][2] = (right + left) / w;
    result[1][2] = (top + bottom) / h;
    result[2][3] = (-2 * far * near) / d;
    result[3][2] = -1;
    result[3][3] = 0.0;

    return result;
  }

  function render(len) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let eye = vec3(x, y, z);
    let at_vec = vec3(0+yaw_val, -1+pitch_val, -1);
    let at = add(eye, at_vec);
    let look_up = vec3(0, 5, 0);
    let modelView = lookAt(eye, at, look_up);
    console.log("eye: ", eye);
    console.log("left, right: ", left, right);
    console.log("bottom, top: ", bottom, top1);
    console.log("near, far: ", near, far);
    console.log(modelView);
    // aspect = (2 + left + right) / (2 + top1 + bottom);
    // let perspect = perspective(60, aspect, y, -20);
    let perspect = frustum(left-1, right+1, bottom-1, top1+1, near+1, far-1);
    
    let modView = gl.getUniformLocation(program, "modelV");
    let perp = gl.getUniformLocation(program, "perp");
    gl.uniformMatrix4fv(modView, false, flatten(modelView));
    gl.uniformMatrix4fv(perp, false, flatten(perspect));
    if (viewMode == 0){
      gl.drawArrays(gl.POINTS, 0, len);
    }
    else if(viewMode == 1){
        gl.drawArrays(gl.LINES, 0, len);
    }
    else{
        gl.drawArrays(gl.TRIANGLES, 0, len);
    }
  }
};
