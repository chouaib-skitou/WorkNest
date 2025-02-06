import { prisma } from "../config/database.js";

export const getUsers = async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

export const updateUser = async (req, res) => {
  const { userId } = req.params;
  const updatedUser = await prisma.user.update({ where: { id: userId }, data: req.body });
  res.json(updatedUser);
};

export const deleteUser = async (req, res) => {
  const { userId } = req.params;
  await prisma.user.delete({ where: { id: userId } });
  res.json({ message: "User deleted" });
};
