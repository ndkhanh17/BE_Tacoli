/**
 * Upload hình ảnh sản phẩm
 */
exports.uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file hình ảnh",
      })
    }

    // Tạo URL cho hình ảnh
    const baseUrl = `${req.protocol}://${req.get("host")}`
    const imageUrl = `${baseUrl}/uploads/products/${req.file.filename}`

    res.status(200).json({
      success: true,
      message: "Upload hình ảnh thành công",
      data: {
        filename: req.file.filename,
        imageUrl: imageUrl,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Upload nhiều hình ảnh sản phẩm
 */
exports.uploadMultipleProductImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ít nhất một file hình ảnh",
      })
    }

    // Tạo URL cho các hình ảnh
    const baseUrl = `${req.protocol}://${req.get("host")}`
    const imageUrls = req.files.map((file) => {
      return {
        filename: file.filename,
        imageUrl: `${baseUrl}/uploads/products/${file.filename}`,
      }
    })

    res.status(200).json({
      success: true,
      message: "Upload hình ảnh thành công",
      data: imageUrls,
    })
  } catch (error) {
    next(error)
  }
}
