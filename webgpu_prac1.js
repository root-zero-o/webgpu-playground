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

// 5-3. 렌더 패스 종료
pass.end();

// 5-4. Finish the command buffer and immediately submit it.
device.queue.submit([encoder.finish()]);
