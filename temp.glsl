
vec3 interpolate_color(color1, color2, P, Q, X){
    float alpha = (X - P) / (Q - P)
    vec3 mapped_color = (1.0 - alpha) * color2 + alpha * color1
    return mapped_color
}

function map_point(P, Q, A, B, X)
{
    alpha = length(subtract(X,P)) / length(subtract(Q,P))
    mapped_X = mix(A,B,alpha)
    return mapped_X
}