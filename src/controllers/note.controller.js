import Notes from "../models/Note.js";

// @ts-ignore
export const createNote = async (req, res) => {
  try {
    const { title, content, tags, isPinned } = req.body;
    const userId = req.user._id; // Assuming the user ID is available in req.user

    const note = new Notes({
      title,
      content,
      tags,
      isPinned,
      user: userId,
    });

    await note.save();
    res.status(201).json({ message: "Note created successfully", note });
  } catch (error) {
    res.status(500).json({ message: "Error creating note", error });
  }
};
