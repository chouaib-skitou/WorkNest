import dotenv from "dotenv";
import { prisma } from "../config/database.js";
import { projectCreationValidationRules } from "../validators/create-project.validator.js";
import { validateRequestProject } from "../middleware/validate.middleware.js";


dotenv.config();

export const createProject = [
    projectCreationValidationRules,
    validateRequestProject,
    async(req,res) => {
    const {projectName, managerEmail } = req.body;

    const existingProject = await prisma.user.findUnique({ where: { projectName }});
    if (existingProject) return res.status(400).json({ error: "Project Name is already taken" })

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user){
        return res.status(401).json({ error: `User with the email address ${managerEmail} not found` })
    }

    const project = await prisma.project.create({
        data: { projectName, managerEmail },
    });

    await sendMail(
        project.managerEmail,
        "Confirmation mail sent to manager",
        `${project.projectName} has been created`,
    )

    res.status(201).json({ message: "Project created." });
    
    }
];

