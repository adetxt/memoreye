export const validateImageExtension = (src: string): boolean => {
  const extWhitelist = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "bmp",
    "tiff",
    "svg",
    "ico",
    "heic",
  ];

  const ext = src.split(".").pop() ?? "";

  if (!extWhitelist.includes(ext)) {
    return false;
  }

  return extWhitelist.includes(ext);
};

export const loadImage = (url: string, cb: (img: HTMLImageElement) => void) => {
  const img = new Image();
  img.src = url;
  img.onload = () => {
    cb(img);
  };
};
