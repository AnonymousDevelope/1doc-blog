const cloudinary = require("cloudinary").v2;
require("dotenv").config();
// Cloudinary sozlamalari
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Rasm yuklash funksiyasi
const uploadImage = async (file, folder = "blogs") => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

// Rasmni o'chirish funksiyasi
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error(`Failed to delete image from Cloudinary: ${error.message}`);
  }
};

// Rasmni transformatsiya qilish (masalan, hajmini o'zgartirish)
const getTransformedImageUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    transformation: [
      { width: options.width || 300, height: options.height || 200, crop: "fill" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  });
};

module.exports = {
  uploadImage,
  deleteImage,
  getTransformedImageUrl,
};