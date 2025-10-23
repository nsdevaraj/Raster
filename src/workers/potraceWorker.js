import { optimize } from 'svgo';

let potraceInstance;

async function ensurePotrace() {
  if (potraceInstance) {
    return potraceInstance;
  }

  const module = await import('potrace-wasm');
  const factory = module.default ?? module;
  potraceInstance = await factory();
  return potraceInstance;
}

function normalizeOptions(options = {}) {
  return {
    turdsize: options.turdSize ?? 2,
    optcurve: true,
    alphamax: options.optTolerance ?? 0.2,
    turnpolicy: options.turnPolicy ?? 'minority',
    color: options.color ?? true,
    threshold: options.threshold ?? 128,
  };
}

export async function traceRasterToSvg(source, options = {}) {
  if (!source) {
    throw new Error('A raster image source is required for tracing.');
  }

  const potrace = await ensurePotrace();
  if (typeof potrace?.trace !== 'function') {
    throw new Error('Potrace trace function is unavailable.');
  }

  let bytes;
  if (source instanceof Uint8Array) {
    bytes = source;
  } else if (ArrayBuffer.isView(source)) {
    bytes = new Uint8Array(
      source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength)
    );
  } else if (source instanceof ArrayBuffer) {
    bytes = new Uint8Array(source);
  } else if (typeof source.arrayBuffer === 'function') {
    const arrayBuffer = await source.arrayBuffer();
    bytes = new Uint8Array(arrayBuffer);
  } else {
    throw new Error('Unsupported raster source type provided.');
  }

  const traceOptions = normalizeOptions(options);
  const rawSvg = await potrace.trace(bytes, traceOptions);

  let optimizedResult;

  try {
    optimizedResult = optimize(rawSvg, {
      multipass: true,
      floatPrecision: options.optimizePrecision ?? 3,
    });
  } catch (error) {
    console.warn('SVGO optimization failed, returning raw SVG output.', error);
  }

  return {
    raw: rawSvg,
    svg: optimizedResult?.data ?? rawSvg,
    optimization: optimizedResult?.info ?? null,
    options: traceOptions,
  };
}
