import { Connection } from "../models/connection.model.js"
import { isValidObjectId } from "../utils/objectId.js"

export const sendConnectionRequest = async (req, res) => {
  try {
    const { receiverId } = req.params
    if (!isValidObjectId(receiverId)) return res.status(400).json({ message: "Invalid receiver id" })
    if (String(receiverId) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot connect with yourself" })
    }

    const existing = await Connection.findOne({
      $or: [
        { sender: req.user._id, receiver: receiverId },
        { sender: receiverId, receiver: req.user._id },
      ],
    })

    if (existing) {
      if (existing.status === "accepted") return res.status(409).json({ message: "Already connected" })
      if (existing.status === "pending") return res.status(409).json({ message: "Request already pending" })
    }

    const connection = await Connection.create({
      sender: req.user._id,
      receiver: receiverId,
      status: "pending",
    })

    return res.status(201).json({ connection })
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "Request already exists" })
    console.error("Send connection error", err)
    return res.status(500).json({ message: "Failed to send request" })
  }
}

export const respondToRequest = async (req, res) => {
  try {
    const { id } = req.params
    const { action } = req.body // "accepted" | "rejected"
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid request id" })
    if (!["accepted", "rejected"].includes(action)) {
      return res.status(400).json({ message: "action must be accepted or rejected" })
    }

    const connection = await Connection.findById(id)
    if (!connection) return res.status(404).json({ message: "Request not found" })

    if (String(connection.receiver) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" })
    }
    if (connection.status !== "pending") {
      return res.status(409).json({ message: "Request already processed" })
    }

    connection.status = action
    await connection.save()
    return res.status(200).json({ connection })
  } catch (err) {
    console.error("Respond request error", err)
    return res.status(500).json({ message: "Failed to respond to request" })
  }
}

export const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid request id" })

    const connection = await Connection.findById(id)
    if (!connection) return res.status(404).json({ message: "Request not found" })
    if (String(connection.sender) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" })
    }
    if (connection.status !== "pending") {
      return res.status(409).json({ message: "Only pending requests can be cancelled" })
    }

    await Connection.findByIdAndDelete(id)
    return res.status(200).json({ message: "Request cancelled" })
  } catch (err) {
    console.error("Cancel request error", err)
    return res.status(500).json({ message: "Failed to cancel request" })
  }
}

export const listIncomingRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      receiver: req.user._id,
      status: "pending",
    })
      .populate("sender", "name email role profilePicture company batch branch")
      .sort({ createdAt: -1 })

    return res.status(200).json({ requests })
  } catch (err) {
    console.error("Incoming requests error", err)
    return res.status(500).json({ message: "Failed to fetch incoming requests" })
  }
}

export const listOutgoingRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      sender: req.user._id,
      status: "pending",
    })
      .populate("receiver", "name email role profilePicture company batch branch")
      .sort({ createdAt: -1 })

    return res.status(200).json({ requests })
  } catch (err) {
    console.error("Outgoing requests error", err)
    return res.status(500).json({ message: "Failed to fetch outgoing requests" })
  }
}

export const listConnections = async (req, res) => {
  try {
    const connections = await Connection.find({
      status: "accepted",
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate("sender", "name email role profilePicture company batch branch")
      .populate("receiver", "name email role profilePicture company batch branch")
      .sort({ updatedAt: -1 })

    const users = connections.map((c) => {
      const other = String(c.sender._id) === String(req.user._id) ? c.receiver : c.sender
      return { connectionId: c._id, user: other }
    })

    return res.status(200).json({ connections: users })
  } catch (err) {
    console.error("List connections error", err)
    return res.status(500).json({ message: "Failed to fetch connections" })
  }
}

