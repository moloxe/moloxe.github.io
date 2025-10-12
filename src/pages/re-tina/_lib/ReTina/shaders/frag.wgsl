struct GlobalUniform {
    UNIFORMS: f32, // #UNIFORMS
};

@group(0) @binding(0) var <uniform> U: GlobalUniform;
@group(0) @binding(1) var u_sampler: sampler;
// #GROUP-1-BINDING-X
// #GROUP-2-BINDING-X

// #COMMON
// #FUNCTIONS
// #RAY_MARCH_FUNCTIONS

@fragment
fn main(@location(0) fragCoord: vec2<f32>) -> @location(0) vec4f {
    let uv = 1. - fragCoord.xy;
    // #INTERLACING
    return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN
}
