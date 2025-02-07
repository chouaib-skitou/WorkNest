import { prisma } from "../config/database.js";

export const getUsers = async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const updatedUser = await prisma.user.update({ where: { id: id }, data: req.body });
  res.json(updatedUser);
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  await prisma.user.delete({ where: { id: id } });
  res.json({ message: "User deleted" });
};
