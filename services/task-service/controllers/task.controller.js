import { prisma } from "../config/database.js";

// Get all tasks
export const getTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        user: true, // Include related user
      },
    });
    res.json(tasks);
  } catch (error) {
    console.error("Error retrieving tasks:", error);
    res.status(500).json({ message: "Error retrieving tasks", error: error.message });
  }
};

export const getTaskById = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: true, // Ensure user relation exists
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error retrieving task:", error);
    res.status(500).json({ message: "Error retrieving task", error: error.message });
  }
};


export const createTask = async (req, res) => {
  const { title, description, status, assignedTo } = req.body;

  // Ensure all required fields are present
  if (!title || !status || !assignedTo) {
    return res.status(400).json({ message: "Title, status, and assignedTo are required." });
  }

  try {
    // Check if the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: assignedTo },
    });

    if (!userExists) {
      return res.status(400).json({ message: "User not found." });
    }

    // Create the task
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        status, // Pass enum value directly (e.g., "PENDING")
        assignedTo,
      },
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Error creating task", error: error.message });
  }
};


// Update an existing task
export const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, assignedTo } = req.body; // status is an enum, not an ID

  try {
    // First, check if the task exists
    const taskExists = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!taskExists) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if the assigned user exists (if assignedTo is provided)
    if (assignedTo) {
      const userExists = await prisma.user.findUnique({
        where: { id: assignedTo },
      });

      if (!userExists) {
        return res.status(400).json({ message: "User not found" });
      }
    }

    // Proceed to update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        status, // Enum value (PENDING, IN_PROGRESS, COMPLETED)
        assignedTo, // User ID of the assigned person
      },
    });

    res.json(updatedTask); // Return the updated task
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Error updating task", error: error.message });
  }
};


export const deleteTask = async (req, res) => {
  const { taskId } = req.params;
  try {
    // Check if the task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // If task exists, delete it
    await prisma.task.delete({
      where: { id: taskId },
    });
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error });
  }
};

