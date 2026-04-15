import jwt from "jsonwebtoken"

const accessTokenExpiry = process.env.JWT_EXPIRES_IN || "15m"
const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d"

export const generateAccessToken = (userId) => {
  return jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
    expiresIn: accessTokenExpiry,
  })
}

export const generateRefreshToken = (userId) => {
  return jwt.sign({ _id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: refreshTokenExpiry,
  })
}

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
}

