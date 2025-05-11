const canvas = document.querySelector("canvas");

// 1. webGPU API를 지원하는지 체크
if (!navigator.gpu) {
  throw new Error("WebGPU not supported on this browser.");
}

// 2. GPUAdapter 요청
const adapter = await navigator.gpu.requestAdapter();

// 2-1. 적절한 Adapter를 찾을 수 없을 때 예외 처리
if (!adapter) {
  throw new Error("No appropriate GPUAdapter found.");
}

// 3. GPUDevice 요청
const device = await adapter.requestDevice();

// 4. 캔버스 구성
const context = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat(); // 기기에 맞는 형식을 알려줌
context.configure({
  device: device,
  format: canvasFormat,
});

// 5. GPU 명령어를 기록하기 (한번에 모아서 보냄)
// 5-1. 명령 기록 시작
const encoder = device.createCommandEncoder();

// 5-2. 렌더 패스 설정
const pass = encoder.beginRenderPass({
  colorAttachments: [
    {
      view: context.getCurrentTexture().createView(),
      loadOp: "clear", // 렌더 패스 시작 시 텍스처를 지움
      clearValue: [0, 0.5, 0.7, 1],
      storeOp: "store", // 렌더 패스 완료 시 렌더 패스 중 그리는 결과가 텍스처에 저장됨
    },
  ],
});

// -------------
// 도형 그리기
// -------------

// 1. 사각형의 꼭짓점 정의

// const vertices = new Float32Array([-0.8, -0.8, 0.8, -0.8, 0.8, 0.8, -0.8, 0.8]);
// -> GPU는 삼각형을 기준으로 작동하므로 삼각형 2개가 필요함

const vertices = new Float32Array([
  // Triangle 1
  -0.8, -0.8, 0.8, -0.8, 0.8, 0.8,
  // Triangle 2
  -0.8, -0.8, 0.8, 0.8, -0.8, 0.8,
]);

// 2. 꼭짓점 버퍼 만들기
const vertexBuffer = device.createBuffer({
  lable: "Cell vertices",
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

// 3. 꼭짓점 데이터를 버퍼의 메모리에 복사
device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/ 0, vertices);

// 4. 꼭짓점 레이아웃 정의
const vertexBufferLayout = {
  arrayStride: 8, // GPU가 다음 꼭짓점을 찾을 때 버퍼에서 앞으로 건너뛰어야 하는 바이트 수
  attributes: [
    // 각 꼭짓점으로 인코딩된 개별 정보
    {
      format: "float32x2", // 꼭짓점 데이터 유형
      offset: 0, // 특정 속성이 시작하는 꼭짓점에 포함된 바이트 수를 설명
      shaderLocation: 0, // Position, see vertex shader
    },
  ],
};

// 5. shader
// WGSL이라는 셰이딩 언어로 작성됨
const cellShaderModule = device.createShaderModule({
  label: "Cell shader",
  code: `
    @vertex
    fn vertexMain(@location(0) pos: vec2f) ->
      @builtin(position) vec4f {
      return vec4f(pos.x, pos.y, 0, 1); 
    }

    @fragment
    fn fragmentMain() -> @location(0) vec4f {
      return vec4f(1, 0, 0, 1);
    }
  `,
});

// 6. 렌더링 파이프라인
const cellPipeline = device.createRenderPipeline({
  label: "Cell pipeline",
  layout: "auto",
  vertex: {
    module: cellShaderModule,
    entryPoint: "vertexMain",
    buffers: [vertexBufferLayout],
  },
  fragment: {
    module: cellShaderModule,
    entryPoint: "fragmentMain",
    targets: [
      {
        format: canvasFormat,
      },
    ],
  },
});

pass.setPipeline(cellPipeline);
pass.setVertexBuffer(0, vertexBuffer);
pass.draw(vertices.length / 2); // 6 vertices

pass.end();
device.queue.submit([encoder.finish()]);
