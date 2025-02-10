import dotenv from "dotenv";
import { prisma } from "../config/database.js";
import { projectCreationValidationRules } from "../validators/create-project.validator.js";
import { validateRequestProject } from "../middleware/validate.middleware.js";

dotenv.config();

export const createProject = [
    projectCreationValidationRules,
    validateRequestProject,
    async (req, res) => {
        const { projectName, managerEmail } = req.body;

        // Check if the project name already exists
        const existingProject = await prisma.project.findUnique({ where: { projectName: projectName } });
        if (existingProject) {
            return res.status(400).json({ error: "Project Name is already taken" });
        }

        // Check if the user with the manager's email exists
        const user = await prisma.user.findUnique({ where: { email: managerEmail } });

        if (!user) {
            return res.status(401).json({ error: `User with the email address ${managerEmail} not found` });
        }

        // Create the project
        const project = await prisma.project.create({
            data: { projectName, managerEmail },
        });

        // Send confirmation email (make sure sendMail is defined)
        await sendMail(
            project.managerEmail,
            "Confirmation mail sent to manager",
            `${project.projectName} has been created`
        );

        res.status(201).json({ message: "Project created." });
    }
];
