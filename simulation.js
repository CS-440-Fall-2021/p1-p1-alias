"use strict";

/** @type {WebGLRenderingContext} */
let escape = false; //to keep track if esc is pressed
let gl;
let resolution = 200;
let perlin_density = 25;

let x = 0.0;
let y = 3.0; //fixing the altitude to 3
let z = 0.0;


let left = 0; //alter left bound of view
let right = 0; //alter right bound of view
let top1 = 0;//alter top bound of view
let bottom = 0;//alter bottom bound of view
let near = 0; //alter near bound of view
let far = 0; //alter far bound of view

let pitch_val = 0;  //alter the pitch rotation
let yaw_val = 0; //alter the yaw rotation
let roll_val = 0; //alter the roll rotation
let speed = 1;//to modify the speed

// let xMin = -10.0;
// let xMax = 10.0;
// let zMin = -10.0;
// let zMax = 10.0;
let cxMin, cxMax, czMin, czMax;
let patches = new Object();

let time = 0;
let forward = 0;
let MaxSpeed = 3;
let MaxAmplitude = 3.5;
let MinAmplitude = 1.5

let eye = vec3(x, y, z);
let modelView;

let vertices = [];
let normals = [];

let viewMode = 1;
let colorMode = 0;

let viewModeHTML;
let colorModeHTML;
let speedHTML; 

function get_patch(xMin, xMax, zMin, zMax) {
    patch = new Patch(xMin, xMax, zMin, zMax, resolution);
    vertices = patch.getTriangleVertices();
    let normalss = [];
    for (let i = 0; i < vertices.length; i++) {
        let [y, normal] = patch.getPerlinNoise(vertices[i][0], vertices[i][1], perlin_density);
        vertices[i] = vec3(
            vertices[i][0],
            y,
            vertices[i][1]
        );
        normalss.push(normal);
    }
    return [vertices, normalss];
}

window.onload = function init() {

    let canvas = document.getElementById("gl-canvas");
    viewModeHTML = document.getElementById("view-mode");
    colorModeHTML = document.getElementById("shade-mode");
    speedHTML = document.getElementById("speed-mode");

    gl = canvas.getContext("webgl2");
    if (!gl) alert("WebGL 2.0 isn't available");

    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.52, 0.8, 0.92, 1.0);

    //  Load shaders and initialize attribute buffers
    let program = initShaders(gl, "vertex-shader-gouraud", "fragment-shader");

    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    gl.useProgram(program);

    window.onkeydown = function (event) {//when a key is pressed
        var key = String.fromCharCode(event.keyCode);
        if (event.keyCode == 27) {//if it is the Esc key
            escape = true; //quit the simulator
            return;
        }
        switch (key) { 
            //mapping of keys according to manual and as per instructions in the page
            case "1":
                if (event.shiftKey) left = (left + 0.1 < 1) ? left + 0.1 : left; //if shift is pressed with one within the limit then increment left by 1
                else left = (left - 0.1 > -1) ? left - 0.1 : left; //if only one is pressed and is within the limit it is decremented 
                break;
            case "2":
                if (event.shiftKey) right = (right + 0.1 < 1) ? right + 0.1 : right;  //if shift is pressed with then within the limit then increment right by 1
                else right = (right - 0.1 > -1) ? right - 0.1 : right; //if only two is pressed and is within the limit it is decremented

                break;
            case "3":
                if (event.shiftKey) top1 = (top1 + 0.1 < 1) ? top1 + 0.1 : top1;//if shift is pressed with three within the limit then increment top by 1
                else top1 = (top1 - 0.1 > -1) ? top1 - 0.1 : top1;//if only three is pressed and is within the limit it is decremented

                break;
            case "4":
                if (event.shiftKey) bottom = (bottom + 0.1 < 1) ? bottom + 0.1 : bottom; //if shift is pressed with four within the limit then increment bottom by 1
                else bottom = (bottom - 0.1 > -1) ? bottom - 0.1 : bottom;//if only four is pressed and is within the limit it is decremented

                break;
            case "5":
                if (event.shiftKey) near = (near + 0.1 < 1) ? near + 0.1 : near; //if shift is pressed with five within the limit then increment near by 1
                else near = (near - 0.1 > -1) ? near - 0.1 : near;//if only five is pressed and is within the limit it is decremented 

                break;
            case "6":
                if (event.shiftKey) far = (far + 0.1 < 1) ? far + 0.1 : far; //if shift is pressed with six within the limit then increment far by 1
                else far = (far - 0.1 > -1) ? far - 0.1 : far; //if only six is pressed and is within the limit it is decremented

                break;
            case "W":
                pitch_val = Math.min(90, pitch_val + 5); //increment pitch val by 5 such that it is within the rotation limit of 90

                break;
            case "S":
                pitch_val = Math.max(-90, pitch_val - 5); //decrement pitch val by 5 such that it is within the rotation limit of 90 in the opposite direction

                break;
            case "A":
                yaw_val = Math.min(90, yaw_val + 5); //increment yaw val by 5 such that it is within the rotation limit of 90
                break;

            case "D":
                yaw_val = Math.max(-90, yaw_val - 5);//decrement yaw val by 5 such that it is within the rotation limit of 90 in the opposite direction

                break;
            case "Q":
                roll_val = Math.min(90, roll_val + 5);  //increment roll val by 5 such that it is within the rotation limit of 90

                break;
            case "E":
                roll_val = Math.max(-90, roll_val - 5); //decrement roll val by 5 such that it is within the rotation limit of 90 in the opposite direction

                break;
            case "&":

            if (speed < MaxSpeed) {  //increase speed by 1 such that it does not exceed the speed limit MaxSpeed
                    speed += 1;
                }

                break;
            case "(":
                if (speed > 0) {//decrease speed by 1 such that it does not fall below 0.
                    speed -= 1;
                }

                break;
            case 'V': // Toggles the drawing mode of points, lines, or fully shaded polygons
                if (viewMode == 2) viewMode = 0;
                else viewMode++;

                break;
            case 'C': // Toggles the different shading modes
                if (colorMode == 3) colorMode = 0;
                if (colorMode == 0) {
                    program = initShaders(gl, "vertex-shader-gouraud", "fragment-shader"); // gourad shading

                }
                else if (colorMode == 1) {
                    program = initShaders(gl, "vertex-shader-flat", "fragment-shader-flat");
                }
                else {
                    program = initShaders(gl, "vertex-shader-phong", "fragment-shader-phong");
                }
                colorMode++;
                gl.enable(gl.DEPTH_TEST);
                gl.useProgram(program);
                break;
        }
    };
    
    eye = vec3(x, y, z);
    setVertices(eye)
    render();

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

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        viewModeHTML.innerHTML = viewingMode(viewMode);
        colorModeHTML.innerHTML = coloringMode(colorMode);
        speedHTML.innerHTML = speed;

        //making matrices wrt to the value of rotations defined
        let yawMat = rotateY(yaw_val); 
        let pitchMat = rotateX(pitch_val);
        let rollMat = rotateZ(roll_val);
        
        //assigning vector to at_vec
        let at_vec = vec3(0, 0, -1);
        at_vec = mult(pitchMat, mult(yawMat, vec4(at_vec)));
        at_vec = vec3(at_vec[0], at_vec[1], at_vec[2]);

        //multiplying the automatic increment happening and speed with the at_vec
        let move = mult(0.01 * speed, at_vec);

        //and add this change to the eye vector
        eye = add(eye, move);

        // Clamp Altitude
        if(eye[1] > MaxAmplitude){
            eye[1] = MaxAmplitude
        }
        else if(eye[1] < MinAmplitude){
            eye[1] = MinAmplitude
        }

        let at = add(eye, at_vec);
        let look_up = vec3(0, 5, 0);
        look_up = mult(rollMat, vec4(look_up));
        look_up = vec3(look_up[0], look_up[1], look_up[2]);

        let modelView = lookAt(eye, at, look_up);
        let perspect = frustum(left - 1, right + 1, bottom - 1, top1 + 1, near + 1, far - 1);
        let normalMat = normalMatrix(modelView, false);

        if ((eye[0] > cxMax) || (eye[0] < cxMin) || (eye[2] > czMax) || (eye[2] < czMin)){
            setVertices(eye);
        }


        let modView = gl.getUniformLocation(program, "modelV");
        let perp = gl.getUniformLocation(program, "perp");
        let normMat = gl.getUniformLocation(program, "normalMat");
        gl.uniformMatrix4fv(modView, false, flatten(modelView));
        gl.uniformMatrix4fv(perp, false, flatten(perspect));
        gl.uniformMatrix3fv(normMat, false, flatten(normalMat));

        if (viewMode == 0) {
            gl.drawArrays(gl.POINTS, 0, vertices.length);
        }
        else if (viewMode == 1) {
            gl.drawArrays(gl.LINES, 0, vertices.length);
        }
        else {
            gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
        }
        if (!escape)
            requestAnimationFrame(render);
        else {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.clearColor(0, 0, 0, 0.3);

        }
    }

    function viewingMode(viewMode) {
        if (viewMode == 0) {
            return "Points";
        }
        else if (viewMode == 1) {
            return "Wireframes";
        }
        else {
            return "Faces";
        }
    }

    function coloringMode(colorMode) {
        if (colorMode == 0 || colorMode == 1) {
            function coloringMode(colorMode) {
                if (colorMode == 0 || colorMode == 1) {
                    return "Smooth";
                }
                else if (colorMode == 2) {
                    return "Flat";
                }
                else if (colorMode == 3) {
                    return "Phong";
                }
            } return "Smooth";
        }
        else if (colorMode == 2) {
            return "Flat";
        }
        else if (colorMode == 3) {
            return "Phong";
        }
    }



    function setVertices(eye) {
        let current, forw, for_left, for_right, left, right;
        let n = Math.floor(eye[0] / 20)
        cxMin = n * 20 ;
        cxMax = (n+1) * 20 ;
        n = Math.trunc(eye[2] / 20)
        czMin = (n-1) * 20 ;
        czMax = n * 20 ;

        if ([cxMin, cxMax, czMin, czMax] in patches) {

            current = patches[[cxMin, cxMax, czMin, czMax]];
        }
        else {
            current = get_patch(cxMin, cxMax, czMin, czMax);

            patches[[cxMin, cxMax, czMin, czMax]] = current;
        }

        if ([cxMin, cxMax, czMin - 20, czMax - 20] in patches) {

            forw = patches[[cxMin, cxMax, czMin - 20, czMax - 20]];

        }
        else {
            forw = get_patch(cxMin, cxMax, czMin - 20, czMax - 20);

            patches[[cxMin, cxMax, czMin - 20, czMax - 20]] = forw;
        }

        if ([cxMin - 20, cxMax - 20, czMin - 20, czMax -20] in patches) {

            for_left = patches[[cxMin - 20, cxMax - 20, czMin - 20, czMax -20]];
        }
        else {
            for_left = get_patch(cxMin - 20, cxMax - 20, czMin - 20, czMax -20);

            patches[[cxMin - 20, cxMax - 20, czMin - 20, czMax -20]] = for_left;
        }

        if ([cxMin + 20, cxMax +20, czMin - 20, czMax - 20] in patches) {

            for_right = patches[[cxMin + 20, cxMax +20, czMin - 20, czMax - 20]];
        }
        else {
            for_right = get_patch(cxMin + 20, cxMax +20, czMin - 20, czMax - 20);

            patches[[cxMin + 20, cxMax +20, czMin - 20, czMax - 20]] = for_right;
        }

        if ([cxMin - 20, cxMax - 20, czMin, czMax] in patches) {

            left = patches[[cxMin - 20, cxMax - 20, czMin, czMax]];
        }
        else {
            left = get_patch(cxMin - 20, cxMax - 20, czMin, czMax);

            patches[[cxMin - 20, cxMax - 20, czMin, czMax]] = left;
        }

        if ([cxMin + 20, cxMax + 20, czMin, czMax] in patches) {

            right = patches[[cxMin + 20, cxMax + 20, czMin, czMax]];
        }
        else {
            right = get_patch(cxMin + 20, cxMax + 20, czMin, czMax);

            patches[[cxMin + 20, cxMax + 20, czMin, czMax]] = right;
        }

        vertices = [];
        normals = [];

        vertices = vertices.concat(current[0]);
        normals = normals.concat(current[1]);
        
        vertices = vertices.concat(forw[0]);
        normals = normals.concat(forw[1]);
        
        vertices = vertices.concat(for_left[0]);
        normals = normals.concat(for_left[1]);
        
        vertices = vertices.concat(for_right[0]);
        normals = normals.concat(for_right[1]);
        
        vertices = vertices.concat(left[0]);
        normals = normals.concat(left[1]);
        
        vertices = vertices.concat(right[0]);
        normals = normals.concat(right[1]);
        
        // Load the data into the GPU and bind to shader variables.
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        // Associate out shader variables with our data buffer
        let vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        // Load the data into the GPU and bind to shader variables.
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

        // Associate out shader variables with our data buffer
        let normal = gl.getAttribLocation(program, "normalInterp");
        gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normal);
    }

};

