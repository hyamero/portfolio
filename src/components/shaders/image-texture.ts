import { texture, type Gpu } from "vgpu";

/** Uploads `image` to a sampleable texture, waiting for it to load first. */
export async function imageTexture(gpu: Gpu, image: HTMLImageElement) {
  // Lazy images: decode() and createImageBitmap() reject on one that hasn't started loading.
  if (!image.complete || !image.naturalWidth) {
    await new Promise((resolve, reject) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", reject, { once: true });
    });
  }
  const bitmap = await createImageBitmap(image);
  const source = texture(gpu, {
    kind: "2d",
    size: [bitmap.width, bitmap.height],
    format: "rgba8unorm",
    usage: ["texture_binding", "copy_dst", "render_attachment"],
  });
  gpu.gpu.queue.copyExternalImageToTexture(
    { source: bitmap },
    { texture: source.gpu },
    [bitmap.width, bitmap.height],
  );
  bitmap.close();
  return source;
}
