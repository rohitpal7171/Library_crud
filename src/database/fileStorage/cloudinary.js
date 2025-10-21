const uploadToCloudinary = async (file, folderPath = 'admin/profile') => {
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!uploadPreset || !cloudName) {
    throw new Error(
      'Cloudinary upload preset or cloud name not configured. Set VITE_CLOUDINARY_UPLOAD_PRESET and VITE_CLOUDINARY_CLOUD_NAME.'
    );
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', uploadPreset);

  fd.append('folder', folderPath);

  const res = await fetch(url, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return json;
};

export { uploadToCloudinary };
