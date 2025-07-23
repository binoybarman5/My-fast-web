const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Image optimization middleware
const optimizeImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const inputPath = req.file.path;
    const outputPath = path.join(
      path.dirname(inputPath),
      `optimized-${path.basename(inputPath)}`
    );

    // Optimize image
    await sharp(inputPath)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Remove original file
    await fs.unlink(inputPath);

    // Update file path in request
    req.file.path = outputPath;
    req.file.originalname = `optimized-${req.file.originalname}`;

    next();
  } catch (error) {
    next(error);
  }
};

// Bulk image optimization middleware
const optimizeImages = async (req, res, next) => {
  if (!req.files) {
    return next();
  }

  try {
    const promises = req.files.map(async (file) => {
      const inputPath = file.path;
      const outputPath = path.join(
        path.dirname(inputPath),
        `optimized-${path.basename(inputPath)}`
      );

      await sharp(inputPath)
        .resize(800, 600, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(outputPath);

      await fs.unlink(inputPath);

      file.path = outputPath;
      file.originalname = `optimized-${file.originalname}`;
    });

    await Promise.all(promises);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  optimizeImage,
  optimizeImages,
};
