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

// @ts-ignore
export const getNotes = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming the user ID is available in req.user

    // Step 1: Find all notes where the 'user' field matches the userId
    // Without populate, the user field would just return the user ID (ObjectId)
    //
    // Step 2: .populate("user", "username email") replaces the user ID with actual user data
    // - First parameter "user": The field name in Notes collection to populate (must be a reference)
    // - Second parameter "username email": Which fields from User collection to include
    //   (This improves performance by not fetching unnecessary fields like password)
    //
    // Result: Instead of { user: "user456" }, you get { user: { _id: "user456", username: "john_doe", email: "john@example.com" } }

    const notes = await Notes.find({ user: userId }).populate(
      "user",
      "username email",
    );
    res.status(200).json({ message: "Notes retrieved successfully", notes });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notes", error });
  }
};
