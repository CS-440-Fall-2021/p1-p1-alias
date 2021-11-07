class Patch{
    constructor (xMin, xMax, zMin, zMax, resolution){
        this.xMin = xMin;
        this.xMax = xMax;
        this.zMin = zMin;
        this.zMax = zMax;
        this.resolution = resolution;
    }

    getTriangleVertices(){
        let vertices = this.getVertices();
        let triangleVertices = [];
        for (let i=0; i<this.resolution; i++){
            for (let j=i*(this.resolution+1); j<(i+1)*(this.resolution+1) ; j++){
                if (j == i*(this.resolution+1)){
                    triangleVertices.push(vertices[j]);
                    triangleVertices.push(vertices[j+1]);
                    triangleVertices.push(vertices[j + this.resolution+1]);
                }    
                else if (j == (i+1)*(this.resolution+1)-1){
                    triangleVertices.push(vertices[j]);
                    triangleVertices.push(vertices[j + this.resolution]);
                    triangleVertices.push(vertices[j + this.resolution+1]);
                }
                else{
                    triangleVertices.push(vertices[j]);
                    triangleVertices.push(vertices[j + this.resolution]);
                    triangleVertices.push(vertices[j + this.resolution+1]);
                    triangleVertices.push(vertices[j]);
                    triangleVertices.push(vertices[j+1]);
                    triangleVertices.push(vertices[j + this.resolution+1]) ;
                }
            }
        }
        return triangleVertices;
    }

    getVertices() {
        let x_list = [];
        let z_list = [];
        for (let i=0; i<this.resolution+1; i++){
            x_list[i] = i * (this.xMax-this.xMin)/this.resolution + this.xMin;
        }
        for (let i=0; i<this.resolution+1; i++){
            z_list[i] = i * (this.zMax-this.zMin)/this.resolution + this.zMin;
        }
        // getting cartesian product of arrays 
        // ref: https://stackoverflow.com/a/43053803
        const cartesian =
                (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
        
        return cartesian(x_list, z_list);
    }

    

    getPerlinNoise(x,z,perlin_density){
        let offsetVectors = this.getOffsetVectors(x,z,perlin_density);
        let [xMin_i, xMax_i, zMin_i, zMax_i] = this.getGridCellIndex(x,z,perlin_density);
        let cellGradV = vec4();
        if (!this.gradV)
            this.gradV = this.getGradientVectors(perlin_density);
        // cellGradV = [bottomLeft, bottomRight, topRight, topLeft]
        cellGradV[0] = this.gradV[xMin_i][zMin_i];
        cellGradV[1] = this.gradV[xMax_i][zMin_i];
        cellGradV[2] = this.gradV[xMax_i][zMax_i];
        cellGradV[3] = this.gradV[xMin_i][zMax_i];
        
        let dots = vec4();
        for (let i=0; i<cellGradV.length;i++){
            dots[i] = dot(cellGradV[i], offsetVectors[i]);
        }
        let wx = x - (xMin_i * (this.xMax-this.xMin)/perlin_density + this.xMin);
        let wz = z - (zMin_i * (this.zMax-this.zMin)/perlin_density + this.zMin);
        
        let dx0 = this.interpolate(dots[0], dots[1], wx);
        let dx1 = this.interpolate(dots[3], dots[2], wx);
        let y = this.interpolate(dx0, dx1, wz);
        
        let dx_n0 = this.normal_interpolate(dots[0], dots[1], wx);
        let dx_n1 = this.normal_interpolate(dots[3], dots[2], wx);
        let n_y = this.normal_interpolate(dx_n0, dx_n1, wz);
        
        let dy_dx = (dots[2]-dots[3]-dots[1]+dots[0]) * 
                ((wz * (wz * 6.0 - 15.0) + 10.0) * wz * wz * wz) *
                ((wx * (wx * 30.0 - 60.0) + 30.0) * wx * wx) + 
                (dots[1]-dots[0]) * ((wx * (wx * 30.0 - 60.0) + 30.0) * wx * wx) 

        let dy_dz = (dots[2]-dots[3]-dots[1]+dots[0]) * 
                ((wx * (wx * 6.0 - 15.0) + 10.0) * wx * wx * wx) *
                ((wz * (wz * 30.0 - 60.0) + 30.0) * wz * wz) + 
                (dots[3]-dots[0]) * ((wz * (wz * 30.0 - 60.0) + 30.0) * wz * wz)        

        let tx = vec3(1, dy_dx, 0);
        let tz = vec3(0, dy_dz, 1);

        let ty = cross(tz, tx);

        // Don't show valley below sea level
        if (y < 0){
            y = 0;
            if (y < -0.05){
                ty = vec3(0,1,0)
            }
        }
        return [y, normalize(ty)];
    }
    
    getGradientVectors(resolution){
        let patchOut = new Array(resolution+1);
        
        for (let i=0; i<resolution+1; i++){
            patchOut[i] = new Array(resolution+1);
            for (let j=0; j<resolution+1; j++){
                let [a, b] = [Math.random() *2 -1, Math.random()*2 -1];
                let mag = Math.sqrt(a**2 + b**2);
                patchOut[i][j] = vec2(a/mag, b/mag); 
            }
        }
        return patchOut;
    }

    getGridCell(x,z,resolution){
        let [cellXMin, cellXMax, cellZMin, cellZMax] = this.getGridCellIndex(x,z,resolution); 
        cellXMin *= (this.xMax-this.xMin)/resolution + this.xMin;
        cellXMax *= (this.xMax-this.xMin)/resolution + this.xMin;
        cellZMin *= (this.zMax-this.zMin)/resolution + this.zMin;
        cellZMax *= (this.zMax-this.zMin)/resolution + this.zMin;
        return [cellXMin, cellXMax, cellZMin, cellZMax];
    }
    
    getGridCellIndex(x,z,resolution){
        let cellXMin = Math.floor((x-this.xMin) / ((this.xMax-this.xMin)/resolution), 1);
        let cellXMax = Math.ceil((x-this.xMin) / ((this.xMax-this.xMin)/resolution), 1);
        let cellZMin = Math.floor((z-this.zMin) / ((this.zMax-this.zMin)/resolution), 1);
        let cellZMax = Math.ceil((z-this.zMin) / ((this.zMax-this.zMin)/resolution), 1);
        return [cellXMin, cellXMax, cellZMin, cellZMax];
    }

    getOffsetVectors(x,z,resolution) {
        let [cellXMin, cellXMax, cellZMin, cellZMax] = this.getGridCell(x,z,resolution);
        // offsetVectors = [bottomLeft, bottomRight, topRight, topLeft]
        let offsetVectors = vec4();
        offsetVectors[0] = vec2(cellXMin - x, cellZMin - z);
        if (offsetVectors[0][0] || offsetVectors[0][1])
        offsetVectors[0] = mult(1/Math.sqrt(offsetVectors[0][0]**2 + offsetVectors[0][1]**2), offsetVectors[0]);
        
        offsetVectors[1] = vec2(cellXMax - x, cellZMin - z);
        if (offsetVectors[1][0] || offsetVectors[1][1])
        offsetVectors[1] = mult(1/Math.sqrt(offsetVectors[1][0]**2 + offsetVectors[1][1]**2), offsetVectors[1]);
        
        offsetVectors[2] = vec2(cellXMax - x, cellZMax - z);
        if (offsetVectors[2][0] || offsetVectors[2][1])
        offsetVectors[2] = mult(1/Math.sqrt(offsetVectors[2][0]**2 + offsetVectors[2][1]**2), offsetVectors[2]);
        
        offsetVectors[3] = vec2(cellXMin - x, cellZMax - z);
        if (offsetVectors[3][0] || offsetVectors[3][1])
        offsetVectors[3] = mult(1/Math.sqrt(offsetVectors[3][0]**2 + offsetVectors[3][1]**2), offsetVectors[3]);

        return offsetVectors;
    }

    // Smootherstep interpolation function 
    // ref: https://en.wikipedia.org/wiki/Smoothstep#Variations
    interpolate(a0, a1, w) {
        // Clamping to the limits:
        if (0.0 > w) return a0;
        if (1.0 < w) return a1;
        
        // return (a1 - a0) * w + a0;

        // Using this cubic interpolation (Smoothstep) for a smooth appearance:
        // return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;

        // Using Smootherstep for an even smoother result with a second derivative equal to zero on boundaries
        return (a1 - a0) * ((w * (w * 6.0 - 15.0) + 10.0) * w * w * w) + a0;
    }

    normal_interpolate(a0, a1, w) {
        // Clamping to the limits:
        if (0.0 > w) return a0;
        if (1.0 < w) return a1;
        
        // return (a1 - a0) * w + a0;

        // Using this cubic interpolation (Smoothstep) for a smooth appearance:
        // return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;

        // Using Smootherstep for an even smoother result with a second derivative equal to zero on boundaries
        return (a1 - a0) * -1/(((w * (w * 30.0 - 60.0) + 30.0) * w * w)) + a0;
    }
}

