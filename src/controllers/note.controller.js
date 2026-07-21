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

    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const searchQuery = req.query.search; // Get search query from request, default to empty string

    console.log(
      `Fetching notes for user: ${userId}, page: ${page}, limit: ${limit}`,
    );

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return res
        .status(400)
        .json({ message: "Page and limit must be positive integers" });
    }

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Get total count of notes for this user
    const total = await Notes.countDocuments({ user: userId });

    // Step 1: Find all notes where the 'user' field matches the userId
    // Without populate, the user field would just return the user ID (ObjectId)
    //
    // Step 2: .populate("user", "username email") replaces the user ID with actual user data
    // - First parameter "user": The field name in Notes collection to populate (must be a reference)
    // - Second parameter "username email": Which fields from User collection to include
    //   (This improves performance by not fetching unnecessary fields like password)
    //
    // Result: Instead of { user: "user456" }, you get { user: { _id: "user456", username: "john_doe", email: "john@example.com" } }

    const notes = await Notes.find({
      user: userId,
      $or: [
        { title: { $regex: searchQuery || "", $options: "i" } },
        { content: { $regex: searchQuery || "", $options: "i" } },
      ],
    })
      .populate("user", "username email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(total / limit);
    // let filteredNotes = notes;
    // if (searchQuery) {
    //   filteredNotes = notes.filter(
    //     (note) =>
    //       note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    //       note.content.toLowerCase().includes(searchQuery.toLowerCase()),
    //   );
    // }

    res.status(200).json({
      message: "Notes retrieved successfully",
      notes,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving notes", error });
  }
};

// @ts-ignore
export const getNoteById = async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user._id; // Assuming the user ID is available in req.user

    const note = await Notes.findOne({ _id: noteId, user: userId }).populate(
      "user",
      "username email",
    );
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.status(200).json({ message: "Note retrieved successfully", note });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving note", error });
  }
};

// @ts-ignore
export const updateNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user._id; // Assuming the user ID is available in req.user
    const { title, content, tags, isPinned } = req.body;
    const note = await Notes.findOne({ _id: noteId, user: userId }).populate(
      "user",
      "username email",
    );
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    note.title = title || note.title;
    note.content = content || note.content;
    note.tags = tags || note.tags;
    note.isPinned = isPinned !== undefined ? isPinned : note.isPinned;
    await note.save();
    res.status(200).json({ message: "Note updated successfully", note });
  } catch (error) {
    res.status(500).json({ message: "Error updating note", error });
  }
};

// @ts-ignore
export const deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user._id; // Assuming the user ID is available in req.user
    const note = await Notes.findOneAndDelete({ _id: noteId, user: userId });
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting note", error });
  }
};
