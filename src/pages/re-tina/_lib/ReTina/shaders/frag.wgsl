struct GlobalUniform {
    UNIFORMS: f32, // #UNIFORMS
};

@group(0) @binding(0) var <uniform> U: GlobalUniform;

// #COMMON
// #RAY_MARCH_FUNCTIONS

@fragment
fn main(@location(0) fragCoord: vec2<f32>) -> @location(0) vec4<f32> {
    let uv = (-1.0 + 2.0 * fragCoord.xy);
    return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN
}
