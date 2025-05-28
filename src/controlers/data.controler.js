// import fs from 'fs';
// const jsonDataHandler = (req, res) => {
//   const data = req.body;

//   if (!data || Object.keys(data).length === 0) {
//     return res.status(400).json({ error: "No data provided" });
//   }

//   console.log("✅ JSON data received from frontend:");
//   console.log(JSON.stringify(data, null, 2)); // pretty print

//   res.status(200).json({ message: "Data received successfully", data });
// };

// export default jsonDataHandler;

// // with file adding to templateimport fs from 'fs';
// import path from "path";
// import fs from "fs";

// const jsonDataHandler = (req, res) => {
//   const data = req.body;

//   if (!data || Object.keys(data).length === 0) {
//     return res.status(400).json({ error: "No data provided" });
//   }

//   // Define target path in the template's src directory
//   // const templateDataPath = path.join(
//   //   process.cwd(),
//   //   "public",
//   //   "portfolio_template",
//   //   "src",
//   //   "data.json"
//   // );
//   const userId = `user_${Date.now()}_${process.pid}_${Math.random()
//     .toString(36)
//     .substr(2, 9)}`;
//   const templateDataPath = path.join(
//     process.cwd(),
//     "public",
//     `portfolio_template_${userId}`,
//     "src",
//     "data.json"
//   );

//   try {
//     // Ensure directory exists
//     fs.mkdirSync(path.dirname(templateDataPath), { recursive: true });

//     // Write data to JSON file
//     fs.writeFileSync(templateDataPath, JSON.stringify(data, null, 2), "utf-8");

//     console.log("✅ JSON data saved to template:");
//     console.log(templateDataPath);
//     console.log("User ID:", userId); // Log the userId for debugging
//     return res.status(200).json({
//       message: "Data received and template updated",
//       userId: userId, // Add this line
//     });
//   } catch (error) {
//     console.error("❌ Error saving JSON:", error.message);
//     return res.status(500).json({ error: "Failed to save template data" });
//   }
// };

// export default jsonDataHandler;

import path from "path";
import fs from "fs";

// Helper function to copy directory recursively
const copyDirectory = (src, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

const jsonDataHandler = (req, res) => {
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: "No data provided" });
  }

  const userId = `user_${Date.now()}_${process.pid}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // Source template path
  const sourceTemplatePath = path.join(
    process.cwd(),
    "public",
    "portfolio_template"
  );

  // Destination path for user-specific template
  const userTemplatePath = path.join(
    process.cwd(),
    "public",
    `portfolio_template_${userId}`
  );

  // Data file path in the new template
  const templateDataPath = path.join(userTemplatePath, "src", "data.json");

  try {
    // Copy the entire template directory
    console.log("📁 Copying template directory...");
    copyDirectory(sourceTemplatePath, userTemplatePath);

    // Write user data to the copied template
    fs.writeFileSync(templateDataPath, JSON.stringify(data, null, 2), "utf-8");

    console.log("✅ Template copied and data saved:");
    console.log("Template path:", userTemplatePath);
    console.log("Data path:", templateDataPath);
    console.log("User ID:", userId);

    return res.status(200).json({
      message: "Data received and template updated",
      userId: userId,
      templatePath: userTemplatePath,
    });
  } catch (error) {
    console.error("❌ Error processing template:", error.message);
    return res.status(500).json({ error: "Failed to process template" });
  }
};

export default jsonDataHandler;
