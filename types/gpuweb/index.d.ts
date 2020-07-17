interface GPUObjectBase {
    label: string;
}
interface GPUObjectDescriptorBase {
    label?: string;
}
interface Navigator {
    readonly gpu: GPU;
}
// declare var Navigator: Navigator;
interface WorkerNavigator {
    readonly gpu: GPU;
}
interface GPU {
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter>;
}
interface GPURequestAdapterOptions {
    powerPreference?: GPUPowerPreference;
}
type GPUPowerPreference = "low-power" | "high-performance";
interface GPUAdapter {
    readonly name: string;
    readonly extensions: ReadonlyArray<GPUExtensionName>;
    requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
}
interface GPUDeviceDescriptor extends GPUObjectDescriptorBase {
    extensions?: Array<GPUExtensionName>;
    limits?: GPULimits;
}
type GPUExtensionName = "texture-compression-bc" | "pipeline-statistics-query" | "timestamp-query" | "depth-clamping";
interface GPULimits {
    maxBindGroups?: GPUSize32;
    maxDynamicUniformBuffersPerPipelineLayout?: GPUSize32;
    maxDynamicStorageBuffersPerPipelineLayout?: GPUSize32;
    maxSampledTexturesPerShaderStage?: GPUSize32;
    maxSamplersPerShaderStage?: GPUSize32;
    maxStorageBuffersPerShaderStage?: GPUSize32;
    maxStorageTexturesPerShaderStage?: GPUSize32;
    maxUniformBuffersPerShaderStage?: GPUSize32;
    maxUniformBufferBindingSize?: GPUSize32;
}
interface GPUDevice extends EventTarget {
    readonly adapter: GPUAdapter;
    readonly extensions: ReadonlyArray<GPUExtensionName>;
    readonly limits: any;
    readonly defaultQueue: GPUQueue;
    createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
    createTexture(descriptor: GPUTextureDescriptor): GPUTexture;
    createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler;
    createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout;
    createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout;
    createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
    createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
    createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
    createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline;
    createReadyComputePipeline(descriptor: GPUComputePipelineDescriptor): Promise<GPUComputePipeline>;
    createReadyRenderPipeline(descriptor: GPURenderPipelineDescriptor): Promise<GPURenderPipeline>;
    createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor): GPUCommandEncoder;
    createRenderBundleEncoder(descriptor: GPURenderBundleEncoderDescriptor): GPURenderBundleEncoder;
    createQuerySet(descriptor: GPUQuerySetDescriptor): GPUQuerySet;
}
interface GPUDevice extends GPUObjectBase {
}
interface GPUBuffer {
    mapAsync(mode: GPUMapModeFlags, offset?: GPUSize64, size?: GPUSize64): Promise<void>;
    getMappedRange(offset?: GPUSize64, size?: GPUSize64): ArrayBuffer;
    unmap(): void;
    destroy(): void;
}
interface GPUBuffer extends GPUObjectBase {
}
interface GPUBufferDescriptor extends GPUObjectDescriptorBase {
    size: GPUSize64;
    usage: GPUBufferUsageFlags;
    mappedAtCreation?: boolean;
}
type GPUBufferUsageFlags = number;
declare var GPUBufferUsage: GPUBufferUsage
interface GPUBufferUsage {
    readonly MAP_READ: GPUBufferUsageFlags;
    readonly MAP_WRITE: GPUBufferUsageFlags;
    readonly COPY_SRC: GPUBufferUsageFlags;
    readonly COPY_DST: GPUBufferUsageFlags;
    readonly INDEX: GPUBufferUsageFlags;
    readonly VERTEX: GPUBufferUsageFlags;
    readonly UNIFORM: GPUBufferUsageFlags;
    readonly STORAGE: GPUBufferUsageFlags;
    readonly INDIRECT: GPUBufferUsageFlags;
    readonly QUERY_RESOLVE: GPUBufferUsageFlags;
}
type GPUMapModeFlags = number;
declare var GPUMapMode: GPUMapMode
interface GPUMapMode {
    readonly READ: GPUMapModeFlags;
    readonly WRITE: GPUMapModeFlags;
}
interface GPUTexture {
    createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView;
    destroy(): void;
}
interface GPUTexture extends GPUObjectBase {
}
interface GPUTextureDescriptor extends GPUObjectDescriptorBase {
    size: GPUExtent3D;
    mipLevelCount?: GPUIntegerCoordinate;
    sampleCount?: GPUSize32;
    dimension?: GPUTextureDimension;
    format: GPUTextureFormat;
    usage: GPUTextureUsageFlags;
}
type GPUTextureDimension = "1d" | "2d" | "3d";
type GPUTextureUsageFlags = number;
declare var GPUTextureUsage: GPUTextureUsage
interface GPUTextureUsage {
    readonly COPY_SRC: GPUTextureUsageFlags;
    readonly COPY_DST: GPUTextureUsageFlags;
    readonly SAMPLED: GPUTextureUsageFlags;
    readonly STORAGE: GPUTextureUsageFlags;
    readonly OUTPUT_ATTACHMENT: GPUTextureUsageFlags;
}
interface GPUTextureView {
}
interface GPUTextureView extends GPUObjectBase {
}
interface GPUTextureViewDescriptor extends GPUObjectDescriptorBase {
    format?: GPUTextureFormat;
    dimension?: GPUTextureViewDimension;
    aspect?: GPUTextureAspect;
    baseMipLevel?: GPUIntegerCoordinate;
    mipLevelCount?: GPUIntegerCoordinate;
    baseArrayLayer?: GPUIntegerCoordinate;
    arrayLayerCount?: GPUIntegerCoordinate;
}
type GPUTextureViewDimension = "1d" | "2d" | "2d-array" | "cube" | "cube-array" | "3d";
type GPUTextureAspect = "all" | "stencil-only" | "depth-only";
type GPUTextureFormat = "r8unorm" | "r8snorm" | "r8uint" | "r8sint" | "r16uint" | "r16sint" | "r16float" | "rg8unorm" | "rg8snorm" | "rg8uint" | "rg8sint" | "r32uint" | "r32sint" | "r32float" | "rg16uint" | "rg16sint" | "rg16float" | "rgba8unorm" | "rgba8unorm-srgb" | "rgba8snorm" | "rgba8uint" | "rgba8sint" | "bgra8unorm" | "bgra8unorm-srgb" | "rgb10a2unorm" | "rg11b10float" | "rg32uint" | "rg32sint" | "rg32float" | "rgba16uint" | "rgba16sint" | "rgba16float" | "rgba32uint" | "rgba32sint" | "rgba32float" | "depth32float" | "depth24plus" | "depth24plus-stencil8" | "bc1-rgba-unorm" | "bc1-rgba-unorm-srgb" | "bc2-rgba-unorm" | "bc2-rgba-unorm-srgb" | "bc3-rgba-unorm" | "bc3-rgba-unorm-srgb" | "bc4-r-unorm" | "bc4-r-snorm" | "bc5-rg-unorm" | "bc5-rg-snorm" | "bc6h-rgb-ufloat" | "bc6h-rgb-sfloat" | "bc7-rgba-unorm" | "bc7-rgba-unorm-srgb";
type GPUTextureComponentType = "float" | "sint" | "uint";
interface GPUSampler {
}
interface GPUSampler extends GPUObjectBase {
}
interface GPUSamplerDescriptor extends GPUObjectDescriptorBase {
    addressModeU?: GPUAddressMode;
    addressModeV?: GPUAddressMode;
    addressModeW?: GPUAddressMode;
    magFilter?: GPUFilterMode;
    minFilter?: GPUFilterMode;
    mipmapFilter?: GPUFilterMode;
    lodMinClamp?: number;
    lodMaxClamp?: number;
    compare?: GPUCompareFunction;
    maxAnisotropy?: number;
}
type GPUAddressMode = "clamp-to-edge" | "repeat" | "mirror-repeat";
type GPUFilterMode = "nearest" | "linear";
type GPUCompareFunction = "never" | "less" | "equal" | "less-equal" | "greater" | "not-equal" | "greater-equal" | "always";
interface GPUBindGroupLayout {
}
interface GPUBindGroupLayout extends GPUObjectBase {
}
interface GPUBindGroupLayoutDescriptor extends GPUObjectDescriptorBase {
    entries: Array<GPUBindGroupLayoutEntry>;
}
interface GPUBindGroupLayoutEntry {
    binding: GPUIndex32;
    visibility: GPUShaderStageFlags;
    type: GPUBindingType;
    hasDynamicOffset?: boolean;
    minBufferBindingSize?: GPUSize64;
    viewDimension?: GPUTextureViewDimension;
    textureComponentType?: GPUTextureComponentType;
    multisampled?: boolean;
    storageTextureFormat?: GPUTextureFormat;
}
type GPUShaderStageFlags = number;
interface GPUShaderStage {
    readonly VERTEX: GPUShaderStageFlags;
    readonly FRAGMENT: GPUShaderStageFlags;
    readonly COMPUTE: GPUShaderStageFlags;
}
type GPUBindingType = "uniform-buffer" | "storage-buffer" | "readonly-storage-buffer" | "sampler" | "comparison-sampler" | "sampled-texture" | "readonly-storage-texture" | "writeonly-storage-texture";
interface GPUBindGroup {
}
interface GPUBindGroup extends GPUObjectBase {
}
interface GPUBindGroupDescriptor extends GPUObjectDescriptorBase {
    layout: GPUBindGroupLayout;
    entries: Array<GPUBindGroupEntry>;
}
type GPUBindingResource = GPUSampler | GPUTextureView | GPUBufferBinding;
interface GPUBindGroupEntry {
    binding: GPUIndex32;
    resource: GPUBindingResource;
}
interface GPUBufferBinding {
    buffer: GPUBuffer;
    offset?: GPUSize64;
    size?: GPUSize64;
}
interface GPUPipelineLayout {
}
interface GPUPipelineLayout extends GPUObjectBase {
}
interface GPUPipelineLayoutDescriptor extends GPUObjectDescriptorBase {
    bindGroupLayouts: Array<GPUBindGroupLayout>;
}
type GPUCompilationMessageType = "error" | "warning" | "info";
interface GPUCompilationMessage {
    readonly message: string;
    readonly type: GPUCompilationMessageType;
    readonly lineNum: number;
    readonly linePos: number;
}
interface GPUCompilationInfo {
    readonly messages: ReadonlyArray<GPUCompilationMessage>;
}
interface GPUShaderModule {
    compilationInfo(): Promise<GPUCompilationInfo>;
}
interface GPUShaderModule extends GPUObjectBase {
}
interface GPUShaderModuleDescriptor extends GPUObjectDescriptorBase {
    code: string;
    sourceMap?: any;
}
interface GPUPipelineDescriptorBase extends GPUObjectDescriptorBase {
    layout?: GPUPipelineLayout;
}
interface GPUPipelineBase {
    getBindGroupLayout(index: number): GPUBindGroupLayout;
}
interface GPUProgrammableStageDescriptor {
    module: GPUShaderModule;
    entryPoint: string;
}
interface GPUComputePipeline {
}
interface GPUComputePipeline extends GPUObjectBase {
}
interface GPUComputePipeline extends GPUPipelineBase {
}
interface GPUComputePipelineDescriptor extends GPUPipelineDescriptorBase {
    computeStage: GPUProgrammableStageDescriptor;
}
interface GPURenderPipeline {
}
interface GPURenderPipeline extends GPUObjectBase {
}
interface GPURenderPipeline extends GPUPipelineBase {
}
interface GPURenderPipelineDescriptor extends GPUPipelineDescriptorBase {
    vertexStage: GPUProgrammableStageDescriptor;
    fragmentStage?: GPUProgrammableStageDescriptor;
    primitiveTopology: GPUPrimitiveTopology;
    rasterizationState?: GPURasterizationStateDescriptor;
    colorStates: Array<GPUColorStateDescriptor>;
    depthStencilState?: GPUDepthStencilStateDescriptor;
    vertexState?: GPUVertexStateDescriptor;
    sampleCount?: GPUSize32;
    sampleMask?: GPUSampleMask;
    alphaToCoverageEnabled?: boolean;
}
type GPUPrimitiveTopology = "point-list" | "line-list" | "line-strip" | "triangle-list" | "triangle-strip";
interface GPURasterizationStateDescriptor {
    frontFace?: GPUFrontFace;
    cullMode?: GPUCullMode;
    clampDepth?: boolean;
    depthBias?: GPUDepthBias;
    depthBiasSlopeScale?: number;
    depthBiasClamp?: number;
}
type GPUFrontFace = "ccw" | "cw";
type GPUCullMode = "none" | "front" | "back";
interface GPUColorStateDescriptor {
    format: GPUTextureFormat;
    alphaBlend?: GPUBlendDescriptor;
    colorBlend?: GPUBlendDescriptor;
    writeMask?: GPUColorWriteFlags;
}
type GPUColorWriteFlags = number;
interface GPUColorWrite {
    readonly RED: GPUColorWriteFlags;
    readonly GREEN: GPUColorWriteFlags;
    readonly BLUE: GPUColorWriteFlags;
    readonly ALPHA: GPUColorWriteFlags;
    readonly ALL: GPUColorWriteFlags;
}
interface GPUBlendDescriptor {
    srcFactor?: GPUBlendFactor;
    dstFactor?: GPUBlendFactor;
    operation?: GPUBlendOperation;
}
type GPUBlendFactor = "zero" | "one" | "src-color" | "one-minus-src-color" | "src-alpha" | "one-minus-src-alpha" | "dst-color" | "one-minus-dst-color" | "dst-alpha" | "one-minus-dst-alpha" | "src-alpha-saturated" | "blend-color" | "one-minus-blend-color";
type GPUBlendOperation = "add" | "subtract" | "reverse-subtract" | "min" | "max";
type GPUStencilOperation = "keep" | "zero" | "replace" | "invert" | "increment-clamp" | "decrement-clamp" | "increment-wrap" | "decrement-wrap";
interface GPUDepthStencilStateDescriptor {
    format: GPUTextureFormat;
    depthWriteEnabled?: boolean;
    depthCompare?: GPUCompareFunction;
    stencilFront?: GPUStencilStateFaceDescriptor;
    stencilBack?: GPUStencilStateFaceDescriptor;
    stencilReadMask?: GPUStencilValue;
    stencilWriteMask?: GPUStencilValue;
}
interface GPUStencilStateFaceDescriptor {
    compare?: GPUCompareFunction;
    failOp?: GPUStencilOperation;
    depthFailOp?: GPUStencilOperation;
    passOp?: GPUStencilOperation;
}
type GPUIndexFormat = "uint16" | "uint32";
type GPUVertexFormat = "uchar2" | "uchar4" | "char2" | "char4" | "uchar2norm" | "uchar4norm" | "char2norm" | "char4norm" | "ushort2" | "ushort4" | "short2" | "short4" | "ushort2norm" | "ushort4norm" | "short2norm" | "short4norm" | "half2" | "half4" | "float" | "float2" | "float3" | "float4" | "uint" | "uint2" | "uint3" | "uint4" | "int" | "int2" | "int3" | "int4";
type GPUInputStepMode = "vertex" | "instance";
interface GPUVertexStateDescriptor {
    indexFormat?: GPUIndexFormat;
    vertexBuffers?: Array<GPUVertexBufferLayoutDescriptor>;
}
interface GPUVertexBufferLayoutDescriptor {
    arrayStride: GPUSize64;
    stepMode?: GPUInputStepMode;
    attributes: Array<GPUVertexAttributeDescriptor>;
}
interface GPUVertexAttributeDescriptor {
    format: GPUVertexFormat;
    offset: GPUSize64;
    shaderLocation: GPUIndex32;
}
interface GPUCommandBuffer {
    readonly executionTime: Promise<number>;
}
interface GPUCommandBuffer extends GPUObjectBase {
}
interface GPUCommandBufferDescriptor extends GPUObjectDescriptorBase {
}
interface GPUCommandEncoder {
    beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
    beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePassEncoder;
    copyBufferToBuffer(source: GPUBuffer, sourceOffset: GPUSize64, destination: GPUBuffer, destinationOffset: GPUSize64, size: GPUSize64): void;
    copyBufferToTexture(source: GPUBufferCopyView, destination: GPUTextureCopyView, copySize: GPUExtent3D): void;
    copyTextureToBuffer(source: GPUTextureCopyView, destination: GPUBufferCopyView, copySize: GPUExtent3D): void;
    copyTextureToTexture(source: GPUTextureCopyView, destination: GPUTextureCopyView, copySize: GPUExtent3D): void;
    pushDebugGroup(groupLabel: string): void;
    popDebugGroup(): void;
    insertDebugMarker(markerLabel: string): void;
    writeTimestamp(querySet: GPUQuerySet, queryIndex: GPUSize32): void;
    resolveQuerySet(querySet: GPUQuerySet, firstQuery: GPUSize32, queryCount: GPUSize32, destination: GPUBuffer, destinationOffset: GPUSize64): void;
    finish(descriptor?: GPUCommandBufferDescriptor): GPUCommandBuffer;
}
interface GPUCommandEncoder extends GPUObjectBase {
}
interface GPUCommandEncoderDescriptor extends GPUObjectDescriptorBase {
    measureExecutionTime?: boolean;
}
interface GPUTextureDataLayout {
    offset?: GPUSize64;
    bytesPerRow: GPUSize32;
    rowsPerImage?: GPUSize32;
}
interface GPUBufferCopyView extends GPUTextureDataLayout {
    buffer: GPUBuffer;
}
interface GPUTextureCopyView {
    texture: GPUTexture;
    mipLevel?: GPUIntegerCoordinate;
    origin?: GPUOrigin3D;
}
interface GPUImageBitmapCopyView {
    imageBitmap: ImageBitmap;
    origin?: GPUOrigin2D;
}
interface GPUProgrammablePassEncoder {
    setBindGroup(index: GPUIndex32, bindGroup: GPUBindGroup, dynamicOffsets?: Array<GPUBufferDynamicOffset>): void;
    setBindGroup(index: GPUIndex32, bindGroup: GPUBindGroup, dynamicOffsetsData: Uint32Array, dynamicOffsetsDataStart: GPUSize64, dynamicOffsetsDataLength: GPUSize32): void;
    pushDebugGroup(groupLabel: string): void;
    popDebugGroup(): void;
    insertDebugMarker(markerLabel: string): void;
}
interface GPUComputePassEncoder {
    setPipeline(pipeline: GPUComputePipeline): void;
    dispatch(x: GPUSize32, y?: GPUSize32, z?: GPUSize32): void;
    dispatchIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64): void;
    beginPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: GPUSize32): void;
    endPipelineStatisticsQuery(): void;
    writeTimestamp(querySet: GPUQuerySet, queryIndex: GPUSize32): void;
    endPass(): void;
}
interface GPUComputePassEncoder extends GPUObjectBase {
}
interface GPUComputePassEncoder extends GPUProgrammablePassEncoder {
}
interface GPUComputePassDescriptor extends GPUObjectDescriptorBase {
}
interface GPURenderEncoderBase {
    setPipeline(pipeline: GPURenderPipeline): void;
    setIndexBuffer(buffer: GPUBuffer, offset?: GPUSize64, size?: GPUSize64): void;
    setVertexBuffer(slot: GPUIndex32, buffer: GPUBuffer, offset?: GPUSize64, size?: GPUSize64): void;
    draw(vertexCount: GPUSize32, instanceCount?: GPUSize32, firstVertex?: GPUSize32, firstInstance?: GPUSize32): void;
    drawIndexed(indexCount: GPUSize32, instanceCount?: GPUSize32, firstIndex?: GPUSize32, baseVertex?: GPUSignedOffset32, firstInstance?: GPUSize32): void;
    drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64): void;
    drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64): void;
}
interface GPURenderPassEncoder {
    setViewport(x: number, y: number, width: number, height: number, minDepth: number, maxDepth: number): void;
    setScissorRect(x: GPUIntegerCoordinate, y: GPUIntegerCoordinate, width: GPUIntegerCoordinate, height: GPUIntegerCoordinate): void;
    setBlendColor(color: GPUColor): void;
    setStencilReference(reference: GPUStencilValue): void;
    beginOcclusionQuery(queryIndex: GPUSize32): void;
    endOcclusionQuery(): void;
    beginPipelineStatisticsQuery(querySet: GPUQuerySet, queryIndex: GPUSize32): void;
    endPipelineStatisticsQuery(): void;
    writeTimestamp(querySet: GPUQuerySet, queryIndex: GPUSize32): void;
    executeBundles(bundles: Array<GPURenderBundle>): void;
    endPass(): void;
}
interface GPURenderPassEncoder extends GPUObjectBase {
}
interface GPURenderPassEncoder extends GPUProgrammablePassEncoder {
}
interface GPURenderPassEncoder extends GPURenderEncoderBase {
}
interface GPURenderPassDescriptor extends GPUObjectDescriptorBase {
    colorAttachments: Array<GPURenderPassColorAttachmentDescriptor>;
    depthStencilAttachment?: GPURenderPassDepthStencilAttachmentDescriptor;
    occlusionQuerySet?: GPUQuerySet;
}
interface GPURenderPassColorAttachmentDescriptor {
    attachment: GPUTextureView;
    resolveTarget?: GPUTextureView;
    loadValue: GPULoadOp | GPUColor;
    storeOp?: GPUStoreOp;
}
interface GPURenderPassDepthStencilAttachmentDescriptor {
    attachment: GPUTextureView;
    depthLoadValue: GPULoadOp | number;
    depthStoreOp: GPUStoreOp;
    depthReadOnly?: boolean;
    stencilLoadValue: GPULoadOp | GPUStencilValue;
    stencilStoreOp: GPUStoreOp;
    stencilReadOnly?: boolean;
}
type GPULoadOp = "load";
type GPUStoreOp = "store" | "clear";
interface GPURenderBundle {
}
interface GPURenderBundle extends GPUObjectBase {
}
interface GPURenderBundleDescriptor extends GPUObjectDescriptorBase {
}
interface GPURenderBundleEncoder {
    finish(descriptor?: GPURenderBundleDescriptor): GPURenderBundle;
}
interface GPURenderBundleEncoder extends GPUObjectBase {
}
interface GPURenderBundleEncoder extends GPUProgrammablePassEncoder {
}
interface GPURenderBundleEncoder extends GPURenderEncoderBase {
}
interface GPURenderBundleEncoderDescriptor extends GPUObjectDescriptorBase {
    colorFormats: Array<GPUTextureFormat>;
    depthStencilFormat?: GPUTextureFormat;
    sampleCount?: GPUSize32;
}
interface GPUQueue {
    submit(commandBuffers: Array<GPUCommandBuffer>): void;
    createFence(descriptor?: GPUFenceDescriptor): GPUFence;
    signal(fence: GPUFence, signalValue: GPUFenceValue): void;
    writeBuffer(buffer: GPUBuffer, bufferOffset: GPUSize64, data: ArrayBuffer, dataOffset?: GPUSize64, size?: GPUSize64): void;
    writeTexture(destination: GPUTextureCopyView, data: ArrayBuffer, dataLayout: GPUTextureDataLayout, size: GPUExtent3D): void;
    copyImageBitmapToTexture(source: GPUImageBitmapCopyView, destination: GPUTextureCopyView, copySize: GPUExtent3D): void;
}
interface GPUQueue extends GPUObjectBase {
}
interface GPUFence {
    getCompletedValue(): GPUFenceValue;
    onCompletion(completionValue: GPUFenceValue): Promise<void>;
}
interface GPUFence extends GPUObjectBase {
}
interface GPUFenceDescriptor extends GPUObjectDescriptorBase {
    initialValue?: GPUFenceValue;
}
interface GPUQuerySet {
    destroy(): void;
}
interface GPUQuerySet extends GPUObjectBase {
}
interface GPUQuerySetDescriptor extends GPUObjectDescriptorBase {
    type: GPUQueryType;
    count: GPUSize32;
    pipelineStatistics?: Array<GPUPipelineStatisticName>;
}
type GPUQueryType = "occlusion" | "pipeline-statistics" | "timestamp";
type GPUPipelineStatisticName = "vertex-shader-invocations" | "clipper-invocations" | "clipper-primitives-out" | "fragment-shader-invocations" | "compute-shader-invocations";
interface GPUCanvasContext {
    configureSwapChain(descriptor: GPUSwapChainDescriptor): GPUSwapChain;
    getSwapChainPreferredFormat(device: GPUDevice): Promise<GPUTextureFormat>;
}
interface GPUSwapChainDescriptor extends GPUObjectDescriptorBase {
    device: GPUDevice;
    format: GPUTextureFormat;
    usage?: GPUTextureUsageFlags;
}
interface GPUSwapChain {
    getCurrentTexture(): GPUTexture;
}
interface GPUSwapChain extends GPUObjectBase {
}
interface GPUDeviceLostInfo {
    readonly message: string;
}
interface GPUDevice {
    readonly lost: Promise<GPUDeviceLostInfo>;
}
type GPUErrorFilter = "out-of-memory" | "validation";
interface GPUOutOfMemoryError {
    new ();
}
interface GPUValidationError {
    new (message: string);
    readonly message: string;
}
type GPUError = GPUOutOfMemoryError | GPUValidationError;
interface GPUDevice {
    pushErrorScope(filter: GPUErrorFilter): void;
    popErrorScope(): Promise<GPUError>;
}
interface GPUUncapturedErrorEvent extends Event {
    new (type: string, gpuUncapturedErrorEventInitDict: GPUUncapturedErrorEventInit);
    readonly error: GPUError;
}
interface GPUUncapturedErrorEventInit extends EventInit {
    error: GPUError;
}
interface GPUDevice {
    onuncapturederror: EventHandler;
}
type GPUBufferDynamicOffset = number;
type GPUFenceValue = number;
type GPUStencilValue = number;
type GPUSampleMask = number;
type GPUDepthBias = number;
type GPUSize64 = number;
type GPUIntegerCoordinate = number;
type GPUIndex32 = number;
type GPUSize32 = number;
type GPUSignedOffset32 = number;
interface GPUColorDict {
    r: number;
    g: number;
    b: number;
    a: number;
}
type GPUColor = Array<number> | GPUColorDict;
interface GPUOrigin2DDict {
    x?: GPUIntegerCoordinate;
    y?: GPUIntegerCoordinate;
}
type GPUOrigin2D = Array<GPUIntegerCoordinate> | GPUOrigin2DDict;
interface GPUOrigin3DDict {
    x?: GPUIntegerCoordinate;
    y?: GPUIntegerCoordinate;
    z?: GPUIntegerCoordinate;
}
type GPUOrigin3D = Array<GPUIntegerCoordinate> | GPUOrigin3DDict;
interface GPUExtent3DDict {
    width: GPUIntegerCoordinate;
    height: GPUIntegerCoordinate;
    depth: GPUIntegerCoordinate;
}
type GPUExtent3D = Array<GPUIntegerCoordinate> | GPUExtent3DDict;
