import multer from "multer"

const storage = multer.memoryStorage()

export const uploadProfileImage = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
})
