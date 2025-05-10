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

console.log(1);
