// import fetch from "node-fetch";
// import fs from "fs";
// import path from "path";
// import archiver from "archiver";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const deployToGitHubPages = async (req, res) => {
//   const { repoName, token } = req.body;

//   // Get the GitHub token from multiple possible sources
//   const githubToken =
//     req.headers.authorization?.replace("Bearer ", "") ||
//     token ||
//     req.query.token;

//   console.log("Deployment request received:", {
//     repoName,
//     hasToken: !!githubToken,
//   });

//   if (!githubToken) {
//     return res.status(401).json({ error: "GitHub token required" });
//   }

//   if (!repoName) {
//     return res.status(400).json({ error: "Repository name required" });
//   }

//   try {
//     // Step 1: Get user info
//     const userResponse = await fetch("https://api.github.com/user", {
//       headers: {
//         Authorization: `token ${githubToken}`,
//         "User-Agent": "Portfolio-Generator",
//       },
//     });

//     if (!userResponse.ok) {
//       throw new Error("Failed to get user info");
//     }

//     const userData = await userResponse.json();
//     const username = userData.login;

//     // Step 2: Create repository
//     const createRepoResponse = await fetch(
//       "https://api.github.com/user/repos",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `token ${githubToken}`,
//           "Content-Type": "application/json",
//           "User-Agent": "Portfolio-Generator",
//         },
//         body: JSON.stringify({
//           name: repoName,
//           description: "My portfolio website built with Portfolio Generator",
//           private: false,
//           auto_init: true,
//         }),
//       }
//     );

//     let repoData;
//     if (createRepoResponse.status === 422) {
//       // Repository already exists, get its info
//       const existingRepoResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}`,
//         {
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "User-Agent": "Portfolio-Generator",
//           },
//         }
//       );

//       if (!existingRepoResponse.ok) {
//         throw new Error("Repository exists but couldn't access it");
//       }

//       repoData = await existingRepoResponse.json();
//     } else if (!createRepoResponse.ok) {
//       const errorData = await createRepoResponse.json();
//       throw new Error(`Failed to create repository: ${errorData.message}`);
//     } else {
//       repoData = await createRepoResponse.json();
//     }

//     // Step 3: Prepare template files
//     const templatePath = path.join(
//       process.cwd(),
//       "public",
//       "portfolio_template"
//     );

//     if (!fs.existsSync(templatePath)) {
//       throw new Error("Portfolio template not found");
//     }

//     // Step 4: Get all files from template directory
//     const filesToUpload = [];

//     const readDirectory = (dirPath, relativePath = "") => {
//       const items = fs.readdirSync(dirPath);

//       for (const item of items) {
//         const fullPath = path.join(dirPath, item);
//         const itemRelativePath = path
//           .join(relativePath, item)
//           .replace(/\\/g, "/");
//         const stat = fs.statSync(fullPath);

//         if (stat.isDirectory()) {
//           readDirectory(fullPath, itemRelativePath);
//         } else {
//           const content = fs.readFileSync(fullPath);
//           filesToUpload.push({
//             path: itemRelativePath,
//             content: content.toString("base64"),
//             encoding: "base64",
//           });
//         }
//       }
//     };

//     readDirectory(templatePath);

//     // Step 5: Upload files to repository
//     for (const file of filesToUpload) {
//       const uploadResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}/contents/${file.path}`,
//         {
//           method: "PUT",
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "Content-Type": "application/json",
//             "User-Agent": "Portfolio-Generator",
//           },
//           body: JSON.stringify({
//             message: `Add ${file.path}`,
//             content: file.content,
//             encoding: file.encoding,
//           }),
//         }
//       );

//       if (!uploadResponse.ok) {
//         // If file exists, get its SHA and update
//         const existingFileResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/contents/${file.path}`,
//           {
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "User-Agent": "Portfolio-Generator",
//             },
//           }
//         );

//         if (existingFileResponse.ok) {
//           const existingFileData = await existingFileResponse.json();

//           const updateResponse = await fetch(
//             `https://api.github.com/repos/${username}/${repoName}/contents/${file.path}`,
//             {
//               method: "PUT",
//               headers: {
//                 Authorization: `token ${githubToken}`,
//                 "Content-Type": "application/json",
//                 "User-Agent": "Portfolio-Generator",
//               },
//               body: JSON.stringify({
//                 message: `Update ${file.path}`,
//                 content: file.content,
//                 encoding: file.encoding,
//                 sha: existingFileData.sha,
//               }),
//             }
//           );

//           if (!updateResponse.ok) {
//             console.error(`Failed to update ${file.path}`);
//           }
//         } else {
//           console.error(`Failed to upload ${file.path}`);
//         }
//       }
//     }

//     // Step 5.5: Handle workflow file specially
//     console.log("Setting up GitHub Actions workflow...");

//     // Find and rename the workflow file during upload
//     const workflowFileIndex = filesToUpload.findIndex(
//       (file) => file.path === ".github/workflows/deploy.yml"
//     );

//     if (workflowFileIndex !== -1) {
//       // Remove from regular upload
//       const workflowFile = filesToUpload.splice(workflowFileIndex, 1)[0];

//       // Upload to correct location with proper path
//       const workflowUploadResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}/contents/.github/workflows/deploy.yml`,
//         {
//           method: "PUT",
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "Content-Type": "application/json",
//             "User-Agent": "Portfolio-Generator",
//           },
//           body: JSON.stringify({
//             message: "Add GitHub Actions workflow",
//             content: workflowFile.content,
//             encoding: workflowFile.encoding,
//           }),
//         }
//       );

//       if (workflowUploadResponse.ok) {
//         console.log("Workflow file uploaded successfully");
//       } else {
//         console.warn("Failed to upload workflow file");
//       }
//     }

//     // Step 6: Enable GitHub Pages with Actions
//     console.log("Step 6: Enabling GitHub Pages with Actions...");
//     let pagesUrl = `https://${username}.github.io/${repoName}`;

//     try {
//       // First check if Pages is already enabled
//       const existingPagesResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}/pages`,
//         {
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "User-Agent": "Portfolio-Generator",
//             Accept: "application/vnd.github+json",
//           },
//         }
//       );

//       if (existingPagesResponse.ok) {
//         // Pages exists, update to use GitHub Actions
//         console.log("Pages already enabled, updating to use GitHub Actions...");

//         const updatePagesResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/pages`,
//           {
//             method: "PUT",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//               Accept: "application/vnd.github+json",
//             },
//             body: JSON.stringify({
//               build_type: "workflow",
//             }),
//           }
//         );

//         if (updatePagesResponse.ok) {
//           const pagesData = await updatePagesResponse.json();
//           pagesUrl = pagesData.html_url;
//           console.log("GitHub Pages updated to use Actions successfully");
//         } else {
//           console.warn("Failed to update Pages to use Actions");
//         }
//       } else if (existingPagesResponse.status === 404) {
//         // Pages doesn't exist, create with GitHub Actions
//         console.log("Creating GitHub Pages with Actions...");

//         const createPagesResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/pages`,
//           {
//             method: "POST",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//               Accept: "application/vnd.github+json",
//             },
//             body: JSON.stringify({
//               build_type: "workflow",
//             }),
//           }
//         );

//         if (createPagesResponse.ok) {
//           const pagesData = await createPagesResponse.json();
//           pagesUrl = pagesData.html_url;
//           console.log("GitHub Pages with Actions created successfully");
//         } else {
//           const errorData = await createPagesResponse.json();
//           console.warn("Failed to create GitHub Pages:", errorData.message);
//         }
//       }
//     } catch (pagesError) {
//       console.warn("Pages configuration error:", pagesError.message);
//       // Continue with default URL
//     }

//     // Step 7: Wait a moment for GitHub to process
//     console.log("Waiting for GitHub to process the deployment...");
//     await new Promise((resolve) => setTimeout(resolve, 2000));

//     // Step 8: Check if workflow file exists and trigger initial run
//     try {
//       const workflowCheckResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}/contents/.github/workflows/deploy.yml`,
//         {
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "User-Agent": "Portfolio-Generator",
//           },
//         }
//       );

//       if (workflowCheckResponse.ok) {
//         console.log(
//           "GitHub Actions workflow detected - deployment will start automatically"
//         );

//         // Wait a moment for GitHub to process the new workflow
//         await new Promise((resolve) => setTimeout(resolve, 2000));

//         // Trigger workflow using the correct repository dispatch endpoint
//         try {
//           const dispatchResponse = await fetch(
//             `https://api.github.com/repos/${username}/${repoName}/dispatches`,
//             {
//               method: "POST",
//               headers: {
//                 Authorization: `token ${githubToken}`,
//                 "Content-Type": "application/json",
//                 "User-Agent": "Portfolio-Generator",
//                 Accept: "application/vnd.github+json",
//               },
//               body: JSON.stringify({
//                 event_type: "deploy",
//               }),
//             }
//           );

//           if (dispatchResponse.ok || dispatchResponse.status === 204) {
//             console.log("Repository dispatch triggered successfully");
//           } else {
//             // Try alternative: workflow dispatch (if workflow has workflow_dispatch trigger)
//             const workflowDispatchResponse = await fetch(
//               `https://api.github.com/repos/${username}/${repoName}/actions/workflows/deploy.yml/dispatches`,
//               {
//                 method: "POST",
//                 headers: {
//                   Authorization: `token ${githubToken}`,
//                   "Content-Type": "application/json",
//                   "User-Agent": "Portfolio-Generator",
//                   Accept: "application/vnd.github+json",
//                 },
//                 body: JSON.stringify({
//                   ref: "main",
//                 }),
//               }
//             );

//             if (
//               workflowDispatchResponse.ok ||
//               workflowDispatchResponse.status === 204
//             ) {
//               console.log("Workflow dispatch triggered successfully");
//             } else {
//               console.log(
//                 "Workflow will trigger automatically on next push or can be run manually"
//               );
//             }
//           }
//         } catch (dispatchError) {
//           console.log(
//             "Manual trigger failed, but workflow will run automatically:",
//             dispatchError.message
//           );
//         }
//       } else {
//         console.warn(
//           "GitHub Actions workflow file not found - manual deployment may be needed"
//         );

//         // Check what files actually exist in .github/workflows/
//         try {
//           const workflowDirResponse = await fetch(
//             `https://api.github.com/repos/${username}/${repoName}/contents/.github/workflows`,
//             {
//               headers: {
//                 Authorization: `token ${githubToken}`,
//                 "User-Agent": "Portfolio-Generator",
//               },
//             }
//           );

//           if (workflowDirResponse.ok) {
//             const files = await workflowDirResponse.json();
//             console.log(
//               "Files in .github/workflows/:",
//               files.map((f) => f.name)
//             );
//           }
//         } catch (dirError) {
//           console.log("Could not check .github/workflows directory");
//         }
//       }
//     } catch (workflowError) {
//       console.warn("Could not check workflow file:", workflowError.message);
//     }

//     // Return success response
//     return res.status(200).json({
//       message: "Portfolio deployed successfully to GitHub Pages",
//       repositoryUrl: repoData.html_url,
//       deploymentUrl: pagesUrl,
//       username: username,
//       repoName: repoName,
//       status: "GitHub Actions will build and deploy your site automatically",
//       note: "It may take 2-5 minutes for your site to be available",
//     });
//   } catch (error) {
//     console.error("Deployment error:", error);
//     return res.status(500).json({
//       error: "Deployment failed",
//       details: error.message,
//     });
//   }
// };

// export default deployToGitHubPages;

// 2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222

// import fetch from "node-fetch";
// import fs from "fs";
// import path from "path";
// import archiver from "archiver";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const deployToGitHubPages = async (req, res) => {
//   const { repoName, token } = req.body;

//   // Get the GitHub token from multiple possible sources
//   const githubToken =
//     req.headers.authorization?.replace("Bearer ", "") ||
//     token ||
//     req.query.token;

//   console.log("Deployment request received:", {
//     repoName,
//     hasToken: !!githubToken,
//   });

//   if (!githubToken) {
//     return res.status(401).json({ error: "GitHub token required" });
//   }

//   if (!repoName) {
//     return res.status(400).json({ error: "Repository name required" });
//   }

//   try {
//     // Step 1: Get user info
//     const userResponse = await fetch("https://api.github.com/user", {
//       headers: {
//         Authorization: `token ${githubToken}`,
//         "User-Agent": "Portfolio-Generator",
//       },
//     });

//     if (!userResponse.ok) {
//       throw new Error("Failed to get user info");
//     }

//     const userData = await userResponse.json();
//     const username = userData.login;

//     // Step 2: Create repository
//     const createRepoResponse = await fetch(
//       "https://api.github.com/user/repos",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `token ${githubToken}`,
//           "Content-Type": "application/json",
//           "User-Agent": "Portfolio-Generator",
//         },
//         body: JSON.stringify({
//           name: repoName,
//           description: "My portfolio website built with Portfolio Generator",
//           private: false,
//           auto_init: true,
//         }),
//       }
//     );

//     let repoData;
//     if (createRepoResponse.status === 422) {
//       // Repository already exists, get its info
//       const existingRepoResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}`,
//         {
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "User-Agent": "Portfolio-Generator",
//           },
//         }
//       );

//       if (!existingRepoResponse.ok) {
//         throw new Error("Repository exists but couldn't access it");
//       }

//       repoData = await existingRepoResponse.json();
//     } else if (!createRepoResponse.ok) {
//       const errorData = await createRepoResponse.json();
//       throw new Error(`Failed to create repository: ${errorData.message}`);
//     } else {
//       repoData = await createRepoResponse.json();
//     }

//     // Step 3: Prepare template files
//     const templatePath = path.join(
//       process.cwd(),
//       "public",
//       "portfolio_template"
//     );

//     if (!fs.existsSync(templatePath)) {
//       throw new Error("Portfolio template not found");
//     }

//     // Step 4: Get all files from template directory
//     const filesToUpload = [];
//     let workflowFileContent = null;

//     const readDirectory = (dirPath, relativePath = "") => {
//       const items = fs.readdirSync(dirPath);

//       for (const item of items) {
//         const fullPath = path.join(dirPath, item);
//         const itemRelativePath = path
//           .join(relativePath, item)
//           .replace(/\\/g, "/");
//         const stat = fs.statSync(fullPath);

//         if (stat.isDirectory()) {
//           readDirectory(fullPath, itemRelativePath);
//         } else {
//           const content = fs.readFileSync(fullPath);

//           // Handle workflow file separately
//           if (itemRelativePath === ".github/workflows/deploy.yml") {
//             workflowFileContent = content.toString("base64");
//             console.log("Found workflow file, will handle separately");
//           } else {
//             filesToUpload.push({
//               path: itemRelativePath,
//               content: content.toString("base64"),
//               encoding: "base64",
//             });
//           }
//         }
//       }
//     };

//     readDirectory(templatePath);

//     // Helper function to upload or update a file
//     const uploadFile = async (filePath, content, encoding = "base64") => {
//       try {
//         // First, try to upload the file
//         const uploadResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//           {
//             method: "PUT",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//             },
//             body: JSON.stringify({
//               message: `Add ${filePath}`,
//               content: content,
//               encoding: encoding,
//             }),
//           }
//         );

//         if (uploadResponse.ok) {
//           console.log(`✓ Uploaded: ${filePath}`);
//           return true;
//         }

//         // If upload failed, try to update existing file
//         if (uploadResponse.status === 422) {
//           const existingFileResponse = await fetch(
//             `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//             {
//               headers: {
//                 Authorization: `token ${githubToken}`,
//                 "User-Agent": "Portfolio-Generator",
//               },
//             }
//           );

//           if (existingFileResponse.ok) {
//             const existingFileData = await existingFileResponse.json();

//             const updateResponse = await fetch(
//               `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//               {
//                 method: "PUT",
//                 headers: {
//                   Authorization: `token ${githubToken}`,
//                   "Content-Type": "application/json",
//                   "User-Agent": "Portfolio-Generator",
//                 },
//                 body: JSON.stringify({
//                   message: `Update ${filePath}`,
//                   content: content,
//                   encoding: encoding,
//                   sha: existingFileData.sha,
//                 }),
//               }
//             );

//             if (updateResponse.ok) {
//               console.log(`✓ Updated: ${filePath}`);
//               return true;
//             } else {
//               console.error(
//                 `✗ Failed to update ${filePath}:`,
//                 await updateResponse.text()
//               );
//               return false;
//             }
//           }
//         }

//         console.error(
//           `✗ Failed to upload ${filePath}:`,
//           await uploadResponse.text()
//         );
//         return false;
//       } catch (error) {
//         console.error(`✗ Error uploading ${filePath}:`, error.message);
//         return false;
//       }
//     };

//     // Step 5: Upload workflow file first (if it exists)
//     if (workflowFileContent) {
//       console.log("Uploading GitHub Actions workflow file...");

//       // Add a small delay to ensure repo is ready
//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       const workflowUploaded = await uploadFile(
//         ".github/workflows/deploy.yml",
//         workflowFileContent,
//         "base64"
//       );

//       if (!workflowUploaded) {
//         console.warn(
//           "Failed to upload workflow file, but continuing with other files..."
//         );
//       }
//     }

//     // Step 6: Upload all other files with rate limiting
//     console.log(`Uploading ${filesToUpload.length} files...`);

//     for (let i = 0; i < filesToUpload.length; i++) {
//       const file = filesToUpload[i];
//       await uploadFile(file.path, file.content, file.encoding);

//       // Add small delay to avoid rate limiting
//       if (i < filesToUpload.length - 1) {
//         await new Promise((resolve) => setTimeout(resolve, 100));
//       }
//     }

//     // Step 7: Enable GitHub Pages with Actions
//     console.log("Enabling GitHub Pages with Actions...");
//     let pagesUrl = `https://${username}.github.io/${repoName}`;

//     try {
//       // Wait a moment for files to be processed
//       await new Promise((resolve) => setTimeout(resolve, 2000));

//       // First check if Pages is already enabled
//       const existingPagesResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}/pages`,
//         {
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "User-Agent": "Portfolio-Generator",
//             Accept: "application/vnd.github+json",
//           },
//         }
//       );

//       if (existingPagesResponse.ok) {
//         // Pages exists, update to use GitHub Actions
//         console.log("Pages already enabled, updating to use GitHub Actions...");

//         const updatePagesResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/pages`,
//           {
//             method: "PUT",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//               Accept: "application/vnd.github+json",
//             },
//             body: JSON.stringify({
//               build_type: "workflow",
//             }),
//           }
//         );

//         if (updatePagesResponse.ok) {
//           const pagesData = await updatePagesResponse.json();
//           pagesUrl = pagesData.html_url;
//           console.log("✓ GitHub Pages updated to use Actions");
//         } else {
//           console.warn("Failed to update Pages to use Actions");
//         }
//       } else if (existingPagesResponse.status === 404) {
//         // Pages doesn't exist, create with GitHub Actions
//         console.log("Creating GitHub Pages with Actions...");

//         const createPagesResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/pages`,
//           {
//             method: "POST",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//               Accept: "application/vnd.github+json",
//             },
//             body: JSON.stringify({
//               build_type: "workflow",
//             }),
//           }
//         );

//         if (createPagesResponse.ok) {
//           const pagesData = await createPagesResponse.json();
//           pagesUrl = pagesData.html_url;
//           console.log("✓ GitHub Pages created with Actions");
//         } else {
//           const errorData = await createPagesResponse.json();
//           console.warn("Failed to create GitHub Pages:", errorData.message);
//         }
//       }
//     } catch (pagesError) {
//       console.warn("Pages configuration error:", pagesError.message);
//     }

//     // Step 8: Verify workflow file exists and try to trigger it
//     if (workflowFileContent) {
//       console.log("Verifying workflow file and attempting to trigger...");

//       // Wait for GitHub to process the workflow file
//       await new Promise((resolve) => setTimeout(resolve, 3000));

//       try {
//         // Check if workflow file exists
//         const workflowCheckResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/contents/.github/workflows/deploy.yml`,
//           {
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "User-Agent": "Portfolio-Generator",
//             },
//           }
//         );

//         if (workflowCheckResponse.ok) {
//           console.log("✓ Workflow file verified in repository");

//           // Try to trigger the workflow
//           try {
//             const workflowDispatchResponse = await fetch(
//               `https://api.github.com/repos/${username}/${repoName}/actions/workflows/deploy.yml/dispatches`,
//               {
//                 method: "POST",
//                 headers: {
//                   Authorization: `token ${githubToken}`,
//                   "Content-Type": "application/json",
//                   "User-Agent": "Portfolio-Generator",
//                   Accept: "application/vnd.github+json",
//                 },
//                 body: JSON.stringify({
//                   ref: "main",
//                 }),
//               }
//             );

//             if (
//               workflowDispatchResponse.ok ||
//               workflowDispatchResponse.status === 204
//             ) {
//               console.log("✓ Workflow triggered successfully");
//             } else {
//               console.log("Workflow will trigger automatically on next push");
//             }
//           } catch (dispatchError) {
//             console.log(
//               "Manual trigger failed, workflow will run automatically"
//             );
//           }
//         } else {
//           console.warn("✗ Workflow file not found in repository after upload");
//         }
//       } catch (workflowError) {
//         console.warn("Could not verify workflow file:", workflowError.message);
//       }
//     }

//     // Return success response
//     return res.status(200).json({
//       message: "Portfolio deployed successfully to GitHub Pages",
//       repositoryUrl: repoData.html_url,
//       deploymentUrl: pagesUrl,
//       username: username,
//       repoName: repoName,
//       status: "GitHub Actions will build and deploy your site automatically",
//       note: "It may take 2-5 minutes for your site to be available",
//     });
//   } catch (error) {
//     console.error("Deployment error:", error);
//     return res.status(500).json({
//       error: "Deployment failed",
//       details: error.message,
//     });
//   }
// };

// export default deployToGitHubPages;

// 333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333

// import fetch from "node-fetch";
// import fs from "fs";
// import path from "path";
// import archiver from "archiver";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const deployToGitHubPages = async (req, res) => {
//   const { repoName, token } = req.body;

//   // Get the GitHub token from multiple possible sources
//   const githubToken =
//     req.headers.authorization?.replace("Bearer ", "") ||
//     token ||
//     req.query.token;

//   console.log("Deployment request received:", {
//     repoName,
//     hasToken: !!githubToken,
//   });

//   if (!githubToken) {
//     return res.status(401).json({ error: "GitHub token required" });
//   }

//   if (!repoName) {
//     return res.status(400).json({ error: "Repository name required" });
//   }

//   try {
//     // Step 1: Get user info
//     const userResponse = await fetch("https://api.github.com/user", {
//       headers: {
//         Authorization: `token ${githubToken}`,
//         "User-Agent": "Portfolio-Generator",
//       },
//     });

//     if (!userResponse.ok) {
//       throw new Error("Failed to get user info");
//     }

//     const userData = await userResponse.json();
//     const username = userData.login;

//     // Step 2: Create repository
//     const createRepoResponse = await fetch(
//       "https://api.github.com/user/repos",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `token ${githubToken}`,
//           "Content-Type": "application/json",
//           "User-Agent": "Portfolio-Generator",
//         },
//         body: JSON.stringify({
//           name: repoName,
//           description: "My portfolio website built with Portfolio Generator",
//           private: false,
//           auto_init: true,
//         }),
//       }
//     );

//     let repoData;
//     if (createRepoResponse.status === 422) {
//       // Repository already exists, get its info
//       const existingRepoResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}`,
//         {
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "User-Agent": "Portfolio-Generator",
//           },
//         }
//       );

//       if (!existingRepoResponse.ok) {
//         throw new Error("Repository exists but couldn't access it");
//       }

//       repoData = await existingRepoResponse.json();
//     } else if (!createRepoResponse.ok) {
//       const errorData = await createRepoResponse.json();
//       throw new Error(`Failed to create repository: ${errorData.message}`);
//     } else {
//       repoData = await createRepoResponse.json();
//     }

//     // Step 3: Prepare template files
//     const templatePath = path.join(
//       process.cwd(),
//       "public",
//       "portfolio_template"
//     );

//     if (!fs.existsSync(templatePath)) {
//       throw new Error("Portfolio template not found");
//     }

//     // Step 4: Get all files from template directory
//     const filesToUpload = [];
//     let workflowFileContent = null;

//     const readDirectory = (dirPath, relativePath = "") => {
//       const items = fs.readdirSync(dirPath);

//       for (const item of items) {
//         const fullPath = path.join(dirPath, item);
//         const itemRelativePath = path
//           .join(relativePath, item)
//           .replace(/\\/g, "/");
//         const stat = fs.statSync(fullPath);

//         if (stat.isDirectory()) {
//           readDirectory(fullPath, itemRelativePath);
//         } else {
//           const content = fs.readFileSync(fullPath);

//           // Handle workflow file separately
//           if (itemRelativePath === ".github/workflows/deploy.yml") {
//             workflowFileContent = content.toString("base64");
//             console.log("Found workflow file, will handle separately");
//           } else {
//             filesToUpload.push({
//               path: itemRelativePath,
//               content: content.toString("base64"),
//               encoding: "base64",
//             });
//           }
//         }
//       }
//     };

//     readDirectory(templatePath);

//     // Helper function to upload or update a file
//     const uploadFile = async (filePath, content, encoding = "base64") => {
//       try {
//         // First, try to upload the file
//         const uploadResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//           {
//             method: "PUT",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//             },
//             body: JSON.stringify({
//               message: `Add ${filePath}`,
//               content: content,
//               encoding: encoding,
//             }),
//           }
//         );

//         if (uploadResponse.ok) {
//           console.log(`✓ Uploaded: ${filePath}`);
//           return true;
//         }

//         // If upload failed, try to update existing file
//         if (uploadResponse.status === 422) {
//           const existingFileResponse = await fetch(
//             `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//             {
//               headers: {
//                 Authorization: `token ${githubToken}`,
//                 "User-Agent": "Portfolio-Generator",
//               },
//             }
//           );

//           if (existingFileResponse.ok) {
//             const existingFileData = await existingFileResponse.json();

//             const updateResponse = await fetch(
//               `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//               {
//                 method: "PUT",
//                 headers: {
//                   Authorization: `token ${githubToken}`,
//                   "Content-Type": "application/json",
//                   "User-Agent": "Portfolio-Generator",
//                 },
//                 body: JSON.stringify({
//                   message: `Update ${filePath}`,
//                   content: content,
//                   encoding: encoding,
//                   sha: existingFileData.sha,
//                 }),
//               }
//             );

//             if (updateResponse.ok) {
//               console.log(`✓ Updated: ${filePath}`);
//               return true;
//             } else {
//               console.error(
//                 `✗ Failed to update ${filePath}:`,
//                 await updateResponse.text()
//               );
//               return false;
//             }
//           }
//         }

//         console.error(
//           `✗ Failed to upload ${filePath}:`,
//           await uploadResponse.text()
//         );
//         return false;
//       } catch (error) {
//         console.error(`✗ Error uploading ${filePath}:`, error.message);
//         return false;
//       }
//     };

//     // Step 5: Upload workflow file with debugging
//     if (workflowFileContent) {
//       console.log("=== WORKFLOW FILE DEBUG INFO ===");

//       // Debug: Check the actual file path and content
//       const templateWorkflowPath = path.join(
//         templatePath,
//         ".github",
//         "workflows",
//         "deploy.yml"
//       );
//       console.log("Looking for workflow file at:", templateWorkflowPath);
//       console.log("File exists:", fs.existsSync(templateWorkflowPath));

//       if (fs.existsSync(templateWorkflowPath)) {
//         const rawContent = fs.readFileSync(templateWorkflowPath, "utf8");
//         console.log("Raw file size:", rawContent.length, "bytes");
//         console.log("First 200 chars:", rawContent.substring(0, 200));
//         console.log("Base64 size:", workflowFileContent.length, "chars");
//       }

//       console.log("Target upload path: .github/workflows/deploy.yml");
//       console.log("=== END DEBUG INFO ===");

//       // Add a small delay to ensure repo is ready
//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       // Try uploading the workflow file directly
//       console.log("Uploading GitHub Actions workflow file...");

//       const workflowUploaded = await uploadFile(
//         ".github/workflows/deploy.yml",
//         workflowFileContent,
//         "base64"
//       );

//       if (!workflowUploaded) {
//         console.warn(
//           "❌ Workflow file upload failed, trying alternative approach..."
//         );

//         // Alternative 1: Try without base64 encoding
//         try {
//           const templateWorkflowPath = path.join(
//             templatePath,
//             ".github",
//             "workflows",
//             "deploy.yml"
//           );
//           if (fs.existsSync(templateWorkflowPath)) {
//             const rawContent = fs.readFileSync(templateWorkflowPath, "utf8");
//             console.log("Trying to upload as plain text...");

//             const plainTextUpload = await fetch(
//               `https://api.github.com/repos/${username}/${repoName}/contents/.github/workflows/deploy.yml`,
//               {
//                 method: "PUT",
//                 headers: {
//                   Authorization: `token ${githubToken}`,
//                   "Content-Type": "application/json",
//                   "User-Agent": "Portfolio-Generator",
//                 },
//                 body: JSON.stringify({
//                   message: "Add GitHub Actions workflow (plain text)",
//                   content: Buffer.from(rawContent, "utf8").toString("base64"),
//                   encoding: "base64",
//                 }),
//               }
//             );

//             if (plainTextUpload.ok) {
//               console.log(
//                 "✅ Workflow uploaded successfully using plain text approach!"
//               );
//             } else {
//               const errorText = await plainTextUpload.text();
//               console.log("❌ Plain text upload also failed:", errorText);

//               // Alternative 2: Try creating a simple workflow first
//               console.log("Trying to create a minimal workflow file...");
//               const minimalWorkflow = `name: Deploy
// on:
//   push:
//     branches: [ main ]
// jobs:
//   deploy:
//     runs-on: ubuntu-latest
//     steps:
//       - uses: actions/checkout@v2
//       - name: Deploy
//         run: echo "Deploying..."`;

//               const minimalBase64 = Buffer.from(
//                 minimalWorkflow,
//                 "utf8"
//               ).toString("base64");

//               const minimalUpload = await fetch(
//                 `https://api.github.com/repos/${username}/${repoName}/contents/.github/workflows/deploy.yml`,
//                 {
//                   method: "PUT",
//                   headers: {
//                     Authorization: `token ${githubToken}`,
//                     "Content-Type": "application/json",
//                     "User-Agent": "Portfolio-Generator",
//                   },
//                   body: JSON.stringify({
//                     message: "Add minimal workflow",
//                     content: minimalBase64,
//                     encoding: "base64",
//                   }),
//                 }
//               );

//               if (minimalUpload.ok) {
//                 console.log("✅ Minimal workflow created successfully!");
//                 console.log(
//                   "🔄 You may need to update it manually with your actual workflow content"
//                 );
//               } else {
//                 console.log(
//                   "❌ Even minimal workflow failed:",
//                   await minimalUpload.text()
//                 );
//               }
//             }
//           }
//         } catch (altError) {
//           console.log("❌ Alternative approaches failed:", altError.message);
//         }
//       } else {
//         console.log("✅ Workflow file uploaded successfully!");
//       }
//     }

//     // Step 6: Upload all other files with rate limiting
//     console.log(`Uploading ${filesToUpload.length} files...`);

//     for (let i = 0; i < filesToUpload.length; i++) {
//       const file = filesToUpload[i];
//       await uploadFile(file.path, file.content, file.encoding);

//       // Add small delay to avoid rate limiting
//       if (i < filesToUpload.length - 1) {
//         await new Promise((resolve) => setTimeout(resolve, 100));
//       }
//     }

//     // Step 7: Enable GitHub Pages with Actions
//     console.log("Enabling GitHub Pages with Actions...");
//     let pagesUrl = `https://${username}.github.io/${repoName}`;

//     try {
//       // Wait a moment for files to be processed
//       await new Promise((resolve) => setTimeout(resolve, 2000));

//       // First check if Pages is already enabled
//       const existingPagesResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}/pages`,
//         {
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "User-Agent": "Portfolio-Generator",
//             Accept: "application/vnd.github+json",
//           },
//         }
//       );

//       if (existingPagesResponse.ok) {
//         // Pages exists, update to use GitHub Actions
//         console.log("Pages already enabled, updating to use GitHub Actions...");

//         const updatePagesResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/pages`,
//           {
//             method: "PUT",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//               Accept: "application/vnd.github+json",
//             },
//             body: JSON.stringify({
//               build_type: "workflow",
//             }),
//           }
//         );

//         if (updatePagesResponse.ok) {
//           const pagesData = await updatePagesResponse.json();
//           pagesUrl = pagesData.html_url;
//           console.log("✓ GitHub Pages updated to use Actions");
//         } else {
//           console.warn("Failed to update Pages to use Actions");
//         }
//       } else if (existingPagesResponse.status === 404) {
//         // Pages doesn't exist, create with GitHub Actions
//         console.log("Creating GitHub Pages with Actions...");

//         const createPagesResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/pages`,
//           {
//             method: "POST",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//               Accept: "application/vnd.github+json",
//             },
//             body: JSON.stringify({
//               build_type: "workflow",
//             }),
//           }
//         );

//         if (createPagesResponse.ok) {
//           const pagesData = await createPagesResponse.json();
//           pagesUrl = pagesData.html_url;
//           console.log("✓ GitHub Pages created with Actions");
//         } else {
//           const errorData = await createPagesResponse.json();
//           console.warn("Failed to create GitHub Pages:", errorData.message);
//         }
//       }
//     } catch (pagesError) {
//       console.warn("Pages configuration error:", pagesError.message);
//     }

//     // Step 8: Verify workflow file exists and try to trigger it
//     if (workflowFileContent) {
//       console.log("Verifying workflow file and attempting to trigger...");

//       // Wait for GitHub to process the workflow file
//       await new Promise((resolve) => setTimeout(resolve, 3000));

//       try {
//         // Check if workflow file exists
//         const workflowCheckResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/contents/.github/workflows/deploy.yml`,
//           {
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "User-Agent": "Portfolio-Generator",
//             },
//           }
//         );

//         if (workflowCheckResponse.ok) {
//           console.log("✓ Workflow file verified in repository");

//           // Try to trigger the workflow
//           try {
//             const workflowDispatchResponse = await fetch(
//               `https://api.github.com/repos/${username}/${repoName}/actions/workflows/deploy.yml/dispatches`,
//               {
//                 method: "POST",
//                 headers: {
//                   Authorization: `token ${githubToken}`,
//                   "Content-Type": "application/json",
//                   "User-Agent": "Portfolio-Generator",
//                   Accept: "application/vnd.github+json",
//                 },
//                 body: JSON.stringify({
//                   ref: "main",
//                 }),
//               }
//             );

//             if (
//               workflowDispatchResponse.ok ||
//               workflowDispatchResponse.status === 204
//             ) {
//               console.log("✓ Workflow triggered successfully");
//             } else {
//               console.log("Workflow will trigger automatically on next push");
//             }
//           } catch (dispatchError) {
//             console.log(
//               "Manual trigger failed, workflow will run automatically"
//             );
//           }
//         } else {
//           console.warn("✗ Workflow file not found in repository after upload");
//         }
//       } catch (workflowError) {
//         console.warn("Could not verify workflow file:", workflowError.message);
//       }
//     }

//     // Return success response
//     return res.status(200).json({
//       message: "Portfolio deployed successfully to GitHub Pages",
//       repositoryUrl: repoData.html_url,
//       deploymentUrl: pagesUrl,
//       username: username,
//       repoName: repoName,
//       status: "GitHub Actions will build and deploy your site automatically",
//       note: "It may take 2-5 minutes for your site to be available",
//     });
//   } catch (error) {
//     console.error("Deployment error:", error);
//     return res.status(500).json({
//       error: "Deployment failed",
//       details: error.message,
//     });
//   }
// };

// export default deployToGitHubPages;

// 44444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444

// import fetch from "node-fetch";
// import fs from "fs";
// import path from "path";
// import archiver from "archiver";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const deployToGitHubPages = async (req, res) => {
//   const { repoName, token } = req.body;

//   // Get the GitHub token from multiple possible sources
//   const githubToken =
//     req.headers.authorization?.replace("Bearer ", "") ||
//     token ||
//     req.query.token;

//   console.log("Deployment request received:", {
//     repoName,
//     hasToken: !!githubToken,
//   });

//   if (!githubToken) {
//     return res.status(401).json({ error: "GitHub token required" });
//   }

//   if (!repoName) {
//     return res.status(400).json({ error: "Repository name required" });
//   }

//   try {
//     // Step 1: Get user info
//     const userResponse = await fetch("https://api.github.com/user", {
//       headers: {
//         Authorization: `token ${githubToken}`,
//         "User-Agent": "Portfolio-Generator",
//       },
//     });

//     if (!userResponse.ok) {
//       throw new Error("Failed to get user info");
//     }

//     const userData = await userResponse.json();
//     const username = userData.login;

//     // Step 2: Create repository
//     const createRepoResponse = await fetch(
//       "https://api.github.com/user/repos",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `token ${githubToken}`,
//           "Content-Type": "application/json",
//           "User-Agent": "Portfolio-Generator",
//         },
//         body: JSON.stringify({
//           name: repoName,
//           description: "My portfolio website built with Portfolio Generator",
//           private: false,
//           auto_init: true,
//         }),
//       }
//     );

//     let repoData;
//     if (createRepoResponse.status === 422) {
//       // Repository already exists, get its info
//       const existingRepoResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}`,
//         {
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "User-Agent": "Portfolio-Generator",
//           },
//         }
//       );

//       if (!existingRepoResponse.ok) {
//         throw new Error("Repository exists but couldn't access it");
//       }

//       repoData = await existingRepoResponse.json();
//     } else if (!createRepoResponse.ok) {
//       const errorData = await createRepoResponse.json();
//       throw new Error(`Failed to create repository: ${errorData.message}`);
//     } else {
//       repoData = await createRepoResponse.json();
//     }

//     // Step 3: Prepare template files
//     const templatePath = path.join(
//       process.cwd(),
//       "public",
//       "portfolio_template"
//     );

//     if (!fs.existsSync(templatePath)) {
//       throw new Error("Portfolio template not found");
//     }

//     // Step 4: Get all files from template directory
//     const filesToUpload = [];
//     let workflowFileContent = null;

//     const readDirectory = (dirPath, relativePath = "") => {
//       const items = fs.readdirSync(dirPath);

//       for (const item of items) {
//         const fullPath = path.join(dirPath, item);
//         const itemRelativePath = path
//           .join(relativePath, item)
//           .replace(/\\/g, "/");
//         const stat = fs.statSync(fullPath);

//         if (stat.isDirectory()) {
//           readDirectory(fullPath, itemRelativePath);
//         } else {
//           const content = fs.readFileSync(fullPath);

//           // Handle workflow file separately
//           if (itemRelativePath === ".github/workflows/deploy.yml") {
//             workflowFileContent = content.toString("base64");
//             console.log("Found workflow file, will handle separately");
//           } else {
//             filesToUpload.push({
//               path: itemRelativePath,
//               content: content.toString("base64"),
//               encoding: "base64",
//             });
//           }
//         }
//       }
//     };

//     readDirectory(templatePath);

//     // Helper function to upload or update a file
//     const uploadFile = async (filePath, content, encoding = "base64") => {
//       try {
//         // First, try to upload the file
//         const uploadResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//           {
//             method: "PUT",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//             },
//             body: JSON.stringify({
//               message: `Add ${filePath}`,
//               content: content,
//               encoding: encoding,
//             }),
//           }
//         );

//         if (uploadResponse.ok) {
//           console.log(`✓ Uploaded: ${filePath}`);
//           return true;
//         }

//         // If upload failed, try to update existing file
//         if (uploadResponse.status === 422) {
//           const existingFileResponse = await fetch(
//             `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//             {
//               headers: {
//                 Authorization: `token ${githubToken}`,
//                 "User-Agent": "Portfolio-Generator",
//               },
//             }
//           );

//           if (existingFileResponse.ok) {
//             const existingFileData = await existingFileResponse.json();

//             const updateResponse = await fetch(
//               `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//               {
//                 method: "PUT",
//                 headers: {
//                   Authorization: `token ${githubToken}`,
//                   "Content-Type": "application/json",
//                   "User-Agent": "Portfolio-Generator",
//                 },
//                 body: JSON.stringify({
//                   message: `Update ${filePath}`,
//                   content: content,
//                   encoding: encoding,
//                   sha: existingFileData.sha,
//                 }),
//               }
//             );

//             if (updateResponse.ok) {
//               console.log(`✓ Updated: ${filePath}`);
//               return true;
//             } else {
//               console.error(
//                 `✗ Failed to update ${filePath}:`,
//                 await updateResponse.text()
//               );
//               return false;
//             }
//           }
//         }

//         console.error(
//           `✗ Failed to upload ${filePath}:`,
//           await uploadResponse.text()
//         );
//         return false;
//       } catch (error) {
//         console.error(`✗ Error uploading ${filePath}:`, error.message);
//         return false;
//       }
//     };

//     // Step 5: Upload workflow file with debugging
//     if (workflowFileContent) {
//       console.log("=== WORKFLOW FILE DEBUG INFO ===");

//       // Debug: Check the actual file path and content
//       const templateWorkflowPath = path.join(
//         templatePath,
//         ".github",
//         "workflows",
//         "deploy.yml"
//       );
//       console.log("Looking for workflow file at:", templateWorkflowPath);
//       console.log("File exists:", fs.existsSync(templateWorkflowPath));

//       if (fs.existsSync(templateWorkflowPath)) {
//         const rawContent = fs.readFileSync(templateWorkflowPath, "utf8");
//         console.log("Raw file size:", rawContent.length, "bytes");
//         console.log("First 200 chars:", rawContent.substring(0, 200));
//         console.log("Base64 size:", workflowFileContent.length, "chars");
//       }

//       console.log("Target upload path: .github/workflows/deploy.yml");
//       console.log("=== END DEBUG INFO ===");

//       // Add a small delay to ensure repo is ready
//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       // Try uploading the workflow file directly
//       console.log("Uploading GitHub Actions workflow file...");

//       const workflowUploaded = await uploadFile(
//         ".github/workflows/deploy.yml",
//         workflowFileContent,
//         "base64"
//       );

//       if (!workflowUploaded) {
//         console.warn(
//           "❌ Workflow file upload failed, trying alternative approach..."
//         );

//         // Alternative 1: Try without base64 encoding
//         try {
//           const templateWorkflowPath = path.join(
//             templatePath,
//             ".github",
//             "workflows",
//             "deploy.yml"
//           );
//           if (fs.existsSync(templateWorkflowPath)) {
//             const rawContent = fs.readFileSync(templateWorkflowPath, "utf8");
//             console.log("Trying to upload as plain text...");

//             const plainTextUpload = await fetch(
//               `https://api.github.com/repos/${username}/${repoName}/contents/.github/workflows/deploy.yml`,
//               {
//                 method: "PUT",
//                 headers: {
//                   Authorization: `token ${githubToken}`,
//                   "Content-Type": "application/json",
//                   "User-Agent": "Portfolio-Generator",
//                 },
//                 body: JSON.stringify({
//                   message: "Add GitHub Actions workflow (plain text)",
//                   content: Buffer.from(rawContent, "utf8").toString("base64"),
//                   encoding: "base64",
//                 }),
//               }
//             );

//             if (plainTextUpload.ok) {
//               console.log(
//                 "✅ Workflow uploaded successfully using plain text approach!"
//               );
//             } else {
//               const errorText = await plainTextUpload.text();
//               console.log("❌ Plain text upload also failed:", errorText);

//               // Alternative 2: Try creating a simple workflow first
//               console.log("Trying to create a minimal workflow file...");
//               const minimalWorkflow = `name: Deploy
// on:
//   push:
//     branches: [ main ]
// jobs:
//   deploy:
//     runs-on: ubuntu-latest
//     steps:
//       - uses: actions/checkout@v2
//       - name: Deploy
//         run: echo "Deploying..."`;

//               const minimalBase64 = Buffer.from(
//                 minimalWorkflow,
//                 "utf8"
//               ).toString("base64");

//               const minimalUpload = await fetch(
//                 `https://api.github.com/repos/${username}/${repoName}/contents/.github/workflows/deploy.yml`,
//                 {
//                   method: "PUT",
//                   headers: {
//                     Authorization: `token ${githubToken}`,
//                     "Content-Type": "application/json",
//                     "User-Agent": "Portfolio-Generator",
//                   },
//                   body: JSON.stringify({
//                     message: "Add minimal workflow",
//                     content: minimalBase64,
//                     encoding: "base64",
//                   }),
//                 }
//               );

//               if (minimalUpload.ok) {
//                 console.log("✅ Minimal workflow created successfully!");
//                 console.log(
//                   "🔄 You may need to update it manually with your actual workflow content"
//                 );
//               } else {
//                 console.log(
//                   "❌ Even minimal workflow failed:",
//                   await minimalUpload.text()
//                 );
//               }
//             }
//           }
//         } catch (altError) {
//           console.log("❌ Alternative approaches failed:", altError.message);
//         }
//       } else {
//         console.log("✅ Workflow file uploaded successfully!");
//       }
//     }
//     // Step 6: Upload all other files with rate limiting
//     console.log(`Uploading ${filesToUpload.length} files...`);

//     for (let i = 0; i < filesToUpload.length; i++) {
//       const file = filesToUpload[i];
//       await uploadFile(file.path, file.content, file.encoding);

//       // Add small delay to avoid rate limiting
//       if (i < filesToUpload.length - 1) {
//         await new Promise((resolve) => setTimeout(resolve, 100));
//       }
//     }

//     // Step 7: Enable GitHub Pages with Actions
//     console.log("Enabling GitHub Pages with Actions...");
//     let pagesUrl = `https://${username}.github.io/${repoName}`;

//     try {
//       // Wait a moment for files to be processed
//       await new Promise((resolve) => setTimeout(resolve, 2000));

//       // First check if Pages is already enabled
//       const existingPagesResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}/pages`,
//         {
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "User-Agent": "Portfolio-Generator",
//             Accept: "application/vnd.github+json",
//           },
//         }
//       );

//       if (existingPagesResponse.ok) {
//         // Pages exists, update to use GitHub Actions
//         console.log("Pages already enabled, updating to use GitHub Actions...");

//         const updatePagesResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/pages`,
//           {
//             method: "PUT",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//               Accept: "application/vnd.github+json",
//             },
//             body: JSON.stringify({
//               build_type: "workflow",
//             }),
//           }
//         );

//         if (updatePagesResponse.ok) {
//           const pagesData = await updatePagesResponse.json();
//           pagesUrl = pagesData.html_url;
//           console.log("✓ GitHub Pages updated to use Actions");
//         } else {
//           console.warn("Failed to update Pages to use Actions");
//         }
//       } else if (existingPagesResponse.status === 404) {
//         // Pages doesn't exist, create with GitHub Actions
//         console.log("Creating GitHub Pages with Actions...");

//         const createPagesResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/pages`,
//           {
//             method: "POST",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//               Accept: "application/vnd.github+json",
//             },
//             body: JSON.stringify({
//               build_type: "workflow",
//             }),
//           }
//         );

//         if (createPagesResponse.ok) {
//           const pagesData = await createPagesResponse.json();
//           pagesUrl = pagesData.html_url;
//           console.log("✓ GitHub Pages created with Actions");
//         } else {
//           const errorData = await createPagesResponse.json();
//           console.warn("Failed to create GitHub Pages:", errorData.message);
//         }
//       }
//     } catch (pagesError) {
//       console.warn("Pages configuration error:", pagesError.message);
//     }

//     // Step 8: Verify workflow file exists and try to trigger it
//     if (workflowFileContent) {
//       console.log("Verifying workflow file and attempting to trigger...");

//       // Wait for GitHub to process the workflow file
//       await new Promise((resolve) => setTimeout(resolve, 3000));

//       try {
//         // Check if workflow file exists
//         const workflowCheckResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/contents/.github/workflows/deploy.yml`,
//           {
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "User-Agent": "Portfolio-Generator",
//             },
//           }
//         );

//         if (workflowCheckResponse.ok) {
//           console.log("✓ Workflow file verified in repository");

//           // Try to trigger the workflow
//           try {
//             const workflowDispatchResponse = await fetch(
//               `https://api.github.com/repos/${username}/${repoName}/actions/workflows/deploy.yml/dispatches`,
//               {
//                 method: "POST",
//                 headers: {
//                   Authorization: `token ${githubToken}`,
//                   "Content-Type": "application/json",
//                   "User-Agent": "Portfolio-Generator",
//                   Accept: "application/vnd.github+json",
//                 },
//                 body: JSON.stringify({
//                   ref: "main",
//                 }),
//               }
//             );

//             if (
//               workflowDispatchResponse.ok ||
//               workflowDispatchResponse.status === 204
//             ) {
//               console.log("✓ Workflow triggered successfully");
//             } else {
//               console.log("Workflow will trigger automatically on next push");
//             }
//           } catch (dispatchError) {
//             console.log(
//               "Manual trigger failed, workflow will run automatically"
//             );
//           }
//         } else {
//           console.warn("✗ Workflow file not found in repository after upload");
//         }
//       } catch (workflowError) {
//         console.warn("Could not verify workflow file:", workflowError.message);
//       }
//     }

//     // Return success response
//     return res.status(200).json({
//       message: "Portfolio deployed successfully to GitHub Pages",
//       repositoryUrl: repoData.html_url,
//       deploymentUrl: pagesUrl,
//       username: username,
//       repoName: repoName,
//       status: "GitHub Actions will build and deploy your site automatically",
//       note: "It may take 2-5 minutes for your site to be available",
//     });
//   } catch (error) {
//     console.error("Deployment error:", error);
//     return res.status(500).json({
//       error: "Deployment failed",
//       details: error.message,
//     });
//   }
// };

// export default deployToGitHubPages;

// //staticccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// import fetch from "node-fetch";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { exec } from "child_process";
// import { promisify } from "util";

// const execAsync = promisify(exec);

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const deployToGitHubPages = async (req, res) => {
//   const { repoName, token } = req.body;

//   // Get the GitHub token from multiple possible sources
//   const githubToken =
//     req.headers.authorization?.replace("Bearer ", "") ||
//     token ||
//     req.query.token;

//   console.log("Deployment request received:", {
//     repoName,
//     hasToken: !!githubToken,
//   });

//   if (!githubToken) {
//     return res.status(401).json({ error: "GitHub token required" });
//   }

//   if (!repoName) {
//     return res.status(400).json({ error: "Repository name required" });
//   }

//   try {
//     // Step 1: Get user info
//     const userResponse = await fetch("https://api.github.com/user", {
//       headers: {
//         Authorization: `token ${githubToken}`,
//         "User-Agent": "Portfolio-Generator",
//       },
//     });

//     if (!userResponse.ok) {
//       throw new Error("Failed to get user info");
//     }

//     const userData = await userResponse.json();
//     const username = userData.login;

//     // Step 2: Create repository
//     const createRepoResponse = await fetch(
//       "https://api.github.com/user/repos",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `token ${githubToken}`,
//           "Content-Type": "application/json",
//           "User-Agent": "Portfolio-Generator",
//         },
//         body: JSON.stringify({
//           name: repoName,
//           description: "My portfolio website built with Portfolio Generator",
//           private: false,
//           auto_init: true,
//         }),
//       }
//     );

//     let repoData;
//     if (createRepoResponse.status === 422) {
//       // Repository already exists, get its info
//       const existingRepoResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}`,
//         {
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "User-Agent": "Portfolio-Generator",
//           },
//         }
//       );

//       if (!existingRepoResponse.ok) {
//         throw new Error("Repository exists but couldn't access it");
//       }

//       repoData = await existingRepoResponse.json();
//     } else if (!createRepoResponse.ok) {
//       const errorData = await createRepoResponse.json();
//       throw new Error(`Failed to create repository: ${errorData.message}`);
//     } else {
//       repoData = await createRepoResponse.json();
//     }

//     // Step 3: Build the React app
//     const templateSourcePath = path.join(
//       process.cwd(),
//       "public",
//       "portfolio_template"
//     );

//     if (!fs.existsSync(templateSourcePath)) {
//       throw new Error("Portfolio template not found");
//     }

//     console.log("Building React application...");

//     // Check if package.json exists
//     const packageJsonPath = path.join(templateSourcePath, "package.json");
//     if (!fs.existsSync(packageJsonPath)) {
//       throw new Error("package.json not found in template directory");
//     }

//     try {
//       // Install dependencies if node_modules doesn't exist
//       const nodeModulesPath = path.join(templateSourcePath, "node_modules");
//       if (!fs.existsSync(nodeModulesPath)) {
//         console.log("Installing dependencies...");
//         const { stdout: installOutput, stderr: installError } = await execAsync(
//           "npm install",
//           {
//             cwd: templateSourcePath,
//             timeout: 300000, // 5 minutes timeout
//           }
//         );

//         if (installError) {
//           console.warn("Install warnings:", installError);
//         }
//         console.log("Dependencies installed successfully");
//       }

//       // Run build command
//       console.log("Running build command...");
//       const { stdout: buildOutput, stderr: buildError } = await execAsync(
//         "npm run build",
//         {
//           cwd: templateSourcePath,
//           timeout: 300000, // 5 minutes timeout
//         }
//       );

//       if (buildError) {
//         console.warn("Build warnings:", buildError);
//       }
//       console.log("Build completed successfully");

//       // Check if dist directory exists (Vite uses 'dist' instead of 'build')
//       const distPath = path.join(templateSourcePath, "dist");
//       if (!fs.existsSync(distPath)) {
//         throw new Error("Dist directory not found after running build command");
//       }

//       // Use the dist directory as our template path
//       const templatePath = distPath;
//     } catch (buildError) {
//       console.error("Build failed:", buildError);
//       throw new Error(`Build process failed: ${buildError.message}`);
//     }

//     // Step 4: Get all static files from dist directory
//     const filesToUpload = [];

//     // Use the dist directory path (Vite's output directory)
//     const distPath = path.join(templateSourcePath, "dist");

//     const readDirectory = (dirPath, relativePath = "") => {
//       const items = fs.readdirSync(dirPath);

//       for (const item of items) {
//         const fullPath = path.join(dirPath, item);
//         const itemRelativePath = path
//           .join(relativePath, item)
//           .replace(/\\/g, "/");
//         const stat = fs.statSync(fullPath);

//         if (stat.isDirectory()) {
//           // Skip .github directory since we're not using workflows
//           if (item !== ".github") {
//             readDirectory(fullPath, itemRelativePath);
//           }
//         } else {
//           // Skip workflow files and package.json files
//           if (
//             !itemRelativePath.includes(".github") &&
//             !itemRelativePath.includes("package.json") &&
//             !itemRelativePath.includes("package-lock.json")
//           ) {
//             const content = fs.readFileSync(fullPath);

//             // Determine if file is binary or text
//             const isBinary = [
//               ".png",
//               ".jpg",
//               ".jpeg",
//               ".gif",
//               ".ico",
//               ".pdf",
//               ".zip",
//               ".woff",
//               ".woff2",
//               ".ttf",
//               ".eot",
//             ].some((ext) => itemRelativePath.toLowerCase().endsWith(ext));

//             filesToUpload.push({
//               path: itemRelativePath,
//               content: content.toString("base64"),
//               encoding: "base64",
//               isBinary: isBinary,
//             });
//           }
//         }
//       }
//     };

//     readDirectory(distPath);

//     // Helper function to upload or update a file
//     const uploadFile = async (filePath, content, encoding = "base64") => {
//       try {
//         // First, try to upload the file
//         const uploadResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//           {
//             method: "PUT",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//             },
//             body: JSON.stringify({
//               message: `Add ${filePath}`,
//               content: content,
//               encoding: encoding,
//             }),
//           }
//         );

//         if (uploadResponse.ok) {
//           console.log(`✓ Uploaded: ${filePath}`);
//           return true;
//         }

//         // If upload failed, try to update existing file
//         if (uploadResponse.status === 422) {
//           const existingFileResponse = await fetch(
//             `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//             {
//               headers: {
//                 Authorization: `token ${githubToken}`,
//                 "User-Agent": "Portfolio-Generator",
//               },
//             }
//           );

//           if (existingFileResponse.ok) {
//             const existingFileData = await existingFileResponse.json();

//             const updateResponse = await fetch(
//               `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//               {
//                 method: "PUT",
//                 headers: {
//                   Authorization: `token ${githubToken}`,
//                   "Content-Type": "application/json",
//                   "User-Agent": "Portfolio-Generator",
//                 },
//                 body: JSON.stringify({
//                   message: `Update ${filePath}`,
//                   content: content,
//                   encoding: encoding,
//                   sha: existingFileData.sha,
//                 }),
//               }
//             );

//             if (updateResponse.ok) {
//               console.log(`✓ Updated: ${filePath}`);
//               return true;
//             } else {
//               console.error(
//                 `✗ Failed to update ${filePath}:`,
//                 await updateResponse.text()
//               );
//               return false;
//             }
//           }
//         }

//         console.error(
//           `✗ Failed to upload ${filePath}:`,
//           await uploadResponse.text()
//         );
//         return false;
//       } catch (error) {
//         console.error(`✗ Error uploading ${filePath}:`, error.message);
//         return false;
//       }
//     };

//     // Step 5: Upload all static files with rate limiting
//     console.log(`Uploading ${filesToUpload.length} static files...`);

//     let uploadedCount = 0;
//     for (let i = 0; i < filesToUpload.length; i++) {
//       const file = filesToUpload[i];
//       const success = await uploadFile(file.path, file.content, file.encoding);
//       if (success) uploadedCount++;

//       // Add small delay to avoid rate limiting
//       if (i < filesToUpload.length - 1) {
//         await new Promise((resolve) => setTimeout(resolve, 100));
//       }
//     }

//     console.log(
//       `Successfully uploaded ${uploadedCount}/${filesToUpload.length} files`
//     );

//     // Step 6: Enable GitHub Pages with static branch deployment
//     console.log("Enabling GitHub Pages for static deployment...");
//     let pagesUrl = `https://${username}.github.io/${repoName}`;

//     try {
//       // Wait a moment for files to be processed
//       await new Promise((resolve) => setTimeout(resolve, 2000));

//       // First check if Pages is already enabled
//       const existingPagesResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}/pages`,
//         {
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "User-Agent": "Portfolio-Generator",
//             Accept: "application/vnd.github+json",
//           },
//         }
//       );

//       if (existingPagesResponse.ok) {
//         // Pages exists, update to use main branch
//         console.log("Pages already enabled, updating to use main branch...");

//         const updatePagesResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/pages`,
//           {
//             method: "PUT",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//               Accept: "application/vnd.github+json",
//             },
//             body: JSON.stringify({
//               source: {
//                 branch: "main",
//                 path: "/",
//               },
//             }),
//           }
//         );

//         if (updatePagesResponse.ok) {
//           const pagesData = await updatePagesResponse.json();
//           pagesUrl = pagesData.html_url;
//           console.log("✓ GitHub Pages updated to serve from main branch");
//         } else {
//           console.warn("Failed to update Pages configuration");
//         }
//       } else if (existingPagesResponse.status === 404) {
//         // Pages doesn't exist, create with main branch
//         console.log("Creating GitHub Pages to serve from main branch...");

//         const createPagesResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/pages`,
//           {
//             method: "POST",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//               Accept: "application/vnd.github+json",
//             },
//             body: JSON.stringify({
//               source: {
//                 branch: "main",
//                 path: "/",
//               },
//             }),
//           }
//         );

//         if (createPagesResponse.ok) {
//           const pagesData = await createPagesResponse.json();
//           pagesUrl = pagesData.html_url;
//           console.log("✓ GitHub Pages created to serve from main branch");
//         } else {
//           const errorData = await createPagesResponse.json();
//           console.warn("Failed to create GitHub Pages:", errorData.message);
//           // Fallback to default URL
//           pagesUrl = `https://${username}.github.io/${repoName}`;
//         }
//       }
//     } catch (pagesError) {
//       console.warn("Pages configuration error:", pagesError.message);
//       // Use default URL as fallback
//       pagesUrl = `https://${username}.github.io/${repoName}`;
//     }

//     // Return success response
//     return res.status(200).json({
//       message: "Portfolio deployed successfully to GitHub Pages",
//       repositoryUrl: repoData.html_url,
//       deploymentUrl: pagesUrl,
//       username: username,
//       repoName: repoName,
//       filesUploaded: uploadedCount,
//       totalFiles: filesToUpload.length,
//       status:
//         "Vite React app built and deployed as static files to main branch",
//       note: "Your site should be available in 2-5 minutes at the deployment URL",
//     });
//   } catch (error) {
//     console.error("Deployment error:", error);
//     return res.status(500).json({
//       error: "Deployment failed",
//       details: error.message,
//     });
//   }
// };

// export default deployToGitHubPages;

// // staticccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
// import fetch from "node-fetch";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { exec } from "child_process";
// import { promisify } from "util";

// const execAsync = promisify(exec);

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const deployToGitHubPages = async (req, res) => {
//   const { repoName, token } = req.body;

//   // Get the GitHub token from multiple possible sources
//   const githubToken =
//     req.headers.authorization?.replace("Bearer ", "") ||
//     token ||
//     req.query.token;

//   console.log("Deployment request received:", {
//     repoName,
//     hasToken: !!githubToken,
//   });

//   if (!githubToken) {
//     return res.status(401).json({ error: "GitHub token required" });
//   }

//   if (!repoName) {
//     return res.status(400).json({ error: "Repository name required" });
//   }

//   try {
//     // Step 1: Get user info
//     const userResponse = await fetch("https://api.github.com/user", {
//       headers: {
//         Authorization: `token ${githubToken}`,
//         "User-Agent": "Portfolio-Generator",
//       },
//     });

//     if (!userResponse.ok) {
//       throw new Error("Failed to get user info");
//     }

//     const userData = await userResponse.json();
//     const username = userData.login;

//     // Step 2: Create repository
//     const createRepoResponse = await fetch(
//       "https://api.github.com/user/repos",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `token ${githubToken}`,
//           "Content-Type": "application/json",
//           "User-Agent": "Portfolio-Generator",
//         },
//         body: JSON.stringify({
//           name: repoName,
//           description: "My portfolio website built with Portfolio Generator",
//           private: false,
//           auto_init: true,
//         }),
//       }
//     );

//     let repoData;
//     if (createRepoResponse.status === 422) {
//       // Repository already exists, get its info
//       const existingRepoResponse = await fetch(
//         `https://api.github.com/repos/${username}/${repoName}`,
//         {
//           headers: {
//             Authorization: `token ${githubToken}`,
//             "User-Agent": "Portfolio-Generator",
//           },
//         }
//       );

//       if (!existingRepoResponse.ok) {
//         throw new Error("Repository exists but couldn't access it");
//       }

//       repoData = await existingRepoResponse.json();
//     } else if (!createRepoResponse.ok) {
//       const errorData = await createRepoResponse.json();
//       throw new Error(`Failed to create repository: ${errorData.message}`);
//     } else {
//       repoData = await createRepoResponse.json();
//     }

//     // Step 3: Prepare template for building
//     const templateSourcePath = path.join(
//       process.cwd(),
//       "public",
//       "portfolio_template"
//     );

//     if (!fs.existsSync(templateSourcePath)) {
//       throw new Error("Portfolio template not found");
//     }

//     console.log("Preparing template for build...");

//     // Create temporary directory for this build
//     const tempBuildPath = path.join(
//       process.cwd(),
//       "temp_builds",
//       `${repoName}_${Date.now()}`
//     );

//     // Copy template to temp directory
//     const copyDirectory = (src, dest) => {
//       if (!fs.existsSync(dest)) {
//         fs.mkdirSync(dest, { recursive: true });
//       }

//       const items = fs.readdirSync(src);
//       for (const item of items) {
//         const srcPath = path.join(src, item);
//         const destPath = path.join(dest, item);
//         const stat = fs.statSync(srcPath);

//         if (stat.isDirectory()) {
//           copyDirectory(srcPath, destPath);
//         } else {
//           fs.copyFileSync(srcPath, destPath);
//         }
//       }
//     };

//     copyDirectory(templateSourcePath, tempBuildPath);

//     // Step 4: Update vite.config.js for GitHub Pages
//     const viteConfigPath = path.join(tempBuildPath, "vite.config.js");
//     if (fs.existsSync(viteConfigPath)) {
//       let viteConfig = fs.readFileSync(viteConfigPath, "utf8");

//       // Update base path for GitHub Pages
//       if (!viteConfig.includes("base:")) {
//         viteConfig = viteConfig.replace(
//           "export default defineConfig({",
//           `export default defineConfig({\n  base: '/${repoName}/',`
//         );
//       } else {
//         viteConfig = viteConfig.replace(
//           /base:\s*['"`][^'"`]*['"`]/,
//           `base: '/${repoName}/'`
//         );
//       }

//       fs.writeFileSync(viteConfigPath, viteConfig);
//       console.log("Updated Vite config for GitHub Pages base path");
//     }

//     console.log("Building React application...");

//     // Check if package.json exists
//     const packageJsonPath = path.join(tempBuildPath, "package.json");
//     if (!fs.existsSync(packageJsonPath)) {
//       throw new Error("package.json not found in template directory");
//     }

//     try {
//       // Install all dependencies (including devDependencies needed for build)
//       console.log("Installing dependencies...");
//       const { stdout: installOutput, stderr: installError } = await execAsync(
//         "npm ci",
//         {
//           cwd: tempBuildPath,
//           timeout: 300000, // 5 minutes timeout
//         }
//       );

//       if (installError && !installError.includes("warn")) {
//         console.error("Install error:", installError);
//         throw new Error(`Failed to install dependencies: ${installError}`);
//       }
//       console.log("Dependencies installed successfully");

//       // Run build command
//       console.log("Running build command...");
//       const { stdout: buildOutput, stderr: buildError } = await execAsync(
//         "npm run build",
//         {
//           cwd: tempBuildPath,
//           timeout: 300000, // 5 minutes timeout
//         }
//       );

//       if (
//         buildError &&
//         !buildError.includes("warn") &&
//         !buildError.includes("will remain unchanged to be resolved at runtime")
//       ) {
//         console.error("Build error:", buildError);
//         throw new Error(`Build failed: ${buildError}`);
//       }
//       console.log("Build completed successfully");
//       console.log("Build output:", buildOutput);

//       // Log any build warnings
//       if (buildError) {
//         console.warn("Build warnings:", buildError);
//       }

//       // Check if dist directory exists
//       const distPath = path.join(tempBuildPath, "dist");
//       if (!fs.existsSync(distPath)) {
//         // Try 'build' directory for Create React App
//         const buildPath = path.join(tempBuildPath, "build");
//         if (fs.existsSync(buildPath)) {
//           console.log("Using 'build' directory instead of 'dist'");
//           // Rename build to dist for consistency
//           fs.renameSync(buildPath, distPath);
//         } else {
//           throw new Error(
//             "Neither 'dist' nor 'build' directory found after build"
//           );
//         }
//       }

//       console.log("Build directory contents:", fs.readdirSync(distPath));
//     } catch (buildError) {
//       console.error("Build failed:", buildError);
//       throw new Error(`Build process failed: ${buildError.message}`);
//     }

//     // Step 6: Get all static files from dist directory
//     const filesToUpload = [];
//     const distPath = path.join(tempBuildPath, "dist");

//     const readDirectory = (dirPath, relativePath = "") => {
//       const items = fs.readdirSync(dirPath);

//       for (const item of items) {
//         const fullPath = path.join(dirPath, item);
//         const itemRelativePath = path
//           .join(relativePath, item)
//           .replace(/\\/g, "/");
//         const stat = fs.statSync(fullPath);

//         if (stat.isDirectory()) {
//           readDirectory(fullPath, itemRelativePath);
//         } else {
//           const content = fs.readFileSync(fullPath);

//           // Determine if file is binary
//           const isBinary = [
//             ".png",
//             ".jpg",
//             ".jpeg",
//             ".gif",
//             ".ico",
//             ".pdf",
//             ".zip",
//             ".woff",
//             ".woff2",
//             ".ttf",
//             ".eot",
//             ".svg",
//             ".webp",
//           ].some((ext) => itemRelativePath.toLowerCase().endsWith(ext));

//           filesToUpload.push({
//             path: itemRelativePath,
//             content: isBinary
//               ? content.toString("base64")
//               : content.toString("utf8"),
//             encoding: isBinary ? "base64" : "utf-8",
//             isBinary: isBinary,
//           });
//         }
//       }
//     };

//     readDirectory(distPath);
//     console.log(`Found ${filesToUpload.length} files to upload`);

//     // Helper function to upload or update a file
//     const uploadFile = async (filePath, content, encoding = "base64") => {
//       try {
//         const body = {
//           message: `Deploy: ${filePath}`,
//           content:
//             encoding === "utf-8"
//               ? Buffer.from(content, "utf8").toString("base64")
//               : content,
//           encoding: "base64",
//         };

//         // First, try to get existing file to update it
//         const existingFileResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//           {
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "User-Agent": "Portfolio-Generator",
//             },
//           }
//         );

//         if (existingFileResponse.ok) {
//           const existingFileData = await existingFileResponse.json();
//           body.sha = existingFileData.sha;
//           body.message = `Update: ${filePath}`;
//         }

//         const uploadResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
//           {
//             method: "PUT",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//             },
//             body: JSON.stringify(body),
//           }
//         );

//         if (uploadResponse.ok) {
//           console.log(`✓ ${body.sha ? "Updated" : "Uploaded"}: ${filePath}`);
//           return true;
//         } else {
//           const errorText = await uploadResponse.text();
//           console.error(`✗ Failed to upload ${filePath}:`, errorText);
//           return false;
//         }
//       } catch (error) {
//         console.error(`✗ Error uploading ${filePath}:`, error.message);
//         return false;
//       }
//     };

//     // Step 7: Upload all static files with rate limiting
//     console.log(`Uploading ${filesToUpload.length} static files...`);

//     let uploadedCount = 0;
//     const batchSize = 5; // Upload in batches to avoid rate limiting

//     for (let i = 0; i < filesToUpload.length; i += batchSize) {
//       const batch = filesToUpload.slice(i, i + batchSize);
//       const uploadPromises = batch.map((file) =>
//         uploadFile(file.path, file.content, file.encoding)
//       );

//       const results = await Promise.all(uploadPromises);
//       uploadedCount += results.filter(Boolean).length;

//       // Add delay between batches
//       if (i + batchSize < filesToUpload.length) {
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//       }
//     }

//     console.log(
//       `Successfully uploaded ${uploadedCount}/${filesToUpload.length} files`
//     );

//     // Step 8: Enable GitHub Pages
//     console.log("Configuring GitHub Pages...");
//     let pagesUrl = `https://${username}.github.io/${repoName}`;

//     try {
//       await new Promise((resolve) => setTimeout(resolve, 3000));

//       const createOrUpdatePages = async () => {
//         const pagesConfig = {
//           source: {
//             branch: "main",
//             path: "/",
//           },
//         };

//         // Try to update first
//         const updateResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/pages`,
//           {
//             method: "PUT",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//               Accept: "application/vnd.github+json",
//             },
//             body: JSON.stringify(pagesConfig),
//           }
//         );

//         if (updateResponse.ok) {
//           const pagesData = await updateResponse.json();
//           return pagesData.html_url;
//         }

//         // If update failed, try to create
//         const createResponse = await fetch(
//           `https://api.github.com/repos/${username}/${repoName}/pages`,
//           {
//             method: "POST",
//             headers: {
//               Authorization: `token ${githubToken}`,
//               "Content-Type": "application/json",
//               "User-Agent": "Portfolio-Generator",
//               Accept: "application/vnd.github+json",
//             },
//             body: JSON.stringify(pagesConfig),
//           }
//         );

//         if (createResponse.ok) {
//           const pagesData = await createResponse.json();
//           return pagesData.html_url;
//         }

//         return null;
//       };

//       const actualPagesUrl = await createOrUpdatePages();
//       if (actualPagesUrl) {
//         pagesUrl = actualPagesUrl;
//         console.log("✓ GitHub Pages configured successfully");
//       } else {
//         console.log("Using default Pages URL");
//       }
//     } catch (pagesError) {
//       console.warn("Pages configuration warning:", pagesError.message);
//     }

//     // Cleanup temp directory
//     try {
//       fs.rmSync(tempBuildPath, { recursive: true, force: true });
//       console.log("Cleaned up temporary build directory");
//     } catch (cleanupError) {
//       console.warn("Failed to cleanup temp directory:", cleanupError.message);
//     }

//     // Return success response
//     return res.status(200).json({
//       message: "Portfolio deployed successfully to GitHub Pages",
//       repositoryUrl: repoData.html_url,
//       deploymentUrl: pagesUrl,
//       username: username,
//       repoName: repoName,
//       filesUploaded: uploadedCount,
//       totalFiles: filesToUpload.length,
//       status: "React app built and deployed to GitHub Pages",
//       note: "Your site should be available in 2-10 minutes at the deployment URL",
//       buildInfo: {
//         distPath: "dist",
//       },
//     });
//   } catch (error) {
//     console.error("Deployment error:", error);
//     return res.status(500).json({
//       error: "Deployment failed",
//       details: error.message,
//       stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
//     });
//   }
// };

// export default deployToGitHubPages;

////////////////////another version for better css deployment//////////////////////

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const deployToGitHubPages = async (req, res) => {
  const { repoName, token } = req.body;

  // Get the GitHub token from multiple possible sources
  const githubToken =
    req.headers.authorization?.replace("Bearer ", "") ||
    token ||
    req.query.token;

  console.log("Deployment request received:", {
    repoName,
    hasToken: !!githubToken,
  });

  if (!githubToken) {
    return res.status(401).json({ error: "GitHub token required" });
  }

  if (!repoName) {
    return res.status(400).json({ error: "Repository name required" });
  }

  try {
    // Step 1: Get user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${githubToken}`,
        "User-Agent": "Portfolio-Generator",
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to get user info");
    }

    const userData = await userResponse.json();
    const username = userData.login;

    // Step 2: Create repository
    const createRepoResponse = await fetch(
      "https://api.github.com/user/repos",
      {
        method: "POST",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
          "User-Agent": "Portfolio-Generator",
        },
        body: JSON.stringify({
          name: repoName,
          description: "My portfolio website built with Portfolio Generator",
          private: false,
          auto_init: true,
        }),
      }
    );

    let repoData;
    if (createRepoResponse.status === 422) {
      // Repository already exists, get its info
      const existingRepoResponse = await fetch(
        `https://api.github.com/repos/${username}/${repoName}`,
        {
          headers: {
            Authorization: `token ${githubToken}`,
            "User-Agent": "Portfolio-Generator",
          },
        }
      );

      if (!existingRepoResponse.ok) {
        throw new Error("Repository exists but couldn't access it");
      }

      repoData = await existingRepoResponse.json();
    } else if (!createRepoResponse.ok) {
      const errorData = await createRepoResponse.json();
      throw new Error(`Failed to create repository: ${errorData.message}`);
    } else {
      repoData = await createRepoResponse.json();
    }

    // Step 3: Prepare template for building
    // const templateSourcePath = path.join(
    //   process.cwd(),
    //   "public",
    //   "portfolio_template"
    // );
    const userId = req.headers["userId"] || req.body.userId;
    console.log(userId);
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("Extracted userId:", userId);

    const templateSourcePath = path.join(
      process.cwd(),
      "public",
      `portfolio_template_${userId}`
    );

    if (!fs.existsSync(templateSourcePath)) {
      throw new Error("Portfolio template not found");
    }

    console.log("Preparing template for build...");

    // Create temporary directory for this build
    // const tempBuildPath = path.join(
    //   process.cwd(),
    //   "temp_builds",
    //   `${repoName}_${Date.now()}`
    // );

    const tempBuildPath = path.join(
      process.cwd(),
      "temp_builds",
      `${repoName}_${Date.now()}_${process.pid}_${Math.random()
        .toString(36)
        .substr(2, 9)}`
    );

    // Copy template to temp directory
    const copyDirectory = (src, dest) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }

      const items = fs.readdirSync(src);
      for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
          copyDirectory(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };

    copyDirectory(templateSourcePath, tempBuildPath);

    // Step 4: Update vite.config.js for GitHub Pages
    const viteConfigPath = path.join(tempBuildPath, "vite.config.js");
    if (fs.existsSync(viteConfigPath)) {
      let viteConfig = fs.readFileSync(viteConfigPath, "utf8");

      // Update base path for GitHub Pages
      if (!viteConfig.includes("base:")) {
        viteConfig = viteConfig.replace(
          "export default defineConfig({",
          `export default defineConfig({\n  base: '/${repoName}/',`
        );
      } else {
        viteConfig = viteConfig.replace(
          /base:\s*['"`][^'"`]*['"`]/,
          `base: '/${repoName}/'`
        );
      }

      // Add build configuration to handle assets better
      if (!viteConfig.includes("build:")) {
        viteConfig = viteConfig.replace(
          `base: '/${repoName}/',`,
          `base: '/${repoName}/',\n  build: {\n    rollupOptions: {\n      external: [],\n      output: {\n        manualChunks: undefined\n      }\n    },\n    assetsInlineLimit: 0\n  },`
        );
      }

      fs.writeFileSync(viteConfigPath, viteConfig);
      console.log(
        "Updated Vite config for GitHub Pages base path and asset handling"
      );
    }

    console.log("Building React application...");

    // Check if package.json exists
    const packageJsonPath = path.join(tempBuildPath, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error("package.json not found in template directory");
    }

    try {
      // Install all dependencies (including devDependencies needed for build)
      console.log("Installing dependencies...");
      const { stdout: installOutput, stderr: installError } = await execAsync(
        "npm ci",
        {
          cwd: tempBuildPath,
          timeout: 300000, // 5 minutes timeout
        }
      );

      if (installError && !installError.includes("warn")) {
        console.error("Install error:", installError);
        throw new Error(`Failed to install dependencies: ${installError}`);
      }
      console.log("Dependencies installed successfully");

      // Run build command
      console.log("Running build command...");
      const { stdout: buildOutput, stderr: buildError } = await execAsync(
        "npm run build",
        {
          cwd: tempBuildPath,
          timeout: 300000, // 5 minutes timeout
        }
      );

      if (
        buildError &&
        !buildError.includes("warn") &&
        !buildError.includes("will remain unchanged to be resolved at runtime")
      ) {
        console.error("Build error:", buildError);
        throw new Error(`Build failed: ${buildError}`);
      }
      console.log("Build completed successfully");
      console.log("Build output:", buildOutput);

      // Log any build warnings
      if (buildError) {
        console.warn("Build warnings:", buildError);
      }

      // Check if dist directory exists
      const distPath = path.join(tempBuildPath, "dist");
      if (!fs.existsSync(distPath)) {
        // Try 'build' directory for Create React App
        const buildPath = path.join(tempBuildPath, "build");
        if (fs.existsSync(buildPath)) {
          console.log("Using 'build' directory instead of 'dist'");
          // Rename build to dist for consistency
          fs.renameSync(buildPath, distPath);
        } else {
          throw new Error(
            "Neither 'dist' nor 'build' directory found after build"
          );
        }
      }

      console.log("Build directory contents:", fs.readdirSync(distPath));
    } catch (buildError) {
      console.error("Build failed:", buildError);
      throw new Error(`Build process failed: ${buildError.message}`);
    }

    // Step 6: Get all static files from dist directory
    const filesToUpload = [];
    const distPath = path.join(tempBuildPath, "dist");

    const readDirectory = (dirPath, relativePath = "") => {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const itemRelativePath = path
          .join(relativePath, item)
          .replace(/\\/g, "/");
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          readDirectory(fullPath, itemRelativePath);
        } else {
          const content = fs.readFileSync(fullPath);

          // Determine if file is binary
          const isBinary = [
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".ico",
            ".pdf",
            ".zip",
            ".woff",
            ".woff2",
            ".ttf",
            ".eot",
            ".svg",
            ".webp",
          ].some((ext) => itemRelativePath.toLowerCase().endsWith(ext));

          filesToUpload.push({
            path: itemRelativePath,
            content: isBinary
              ? content.toString("base64")
              : content.toString("utf8"),
            encoding: isBinary ? "base64" : "utf-8",
            isBinary: isBinary,
          });
        }
      }
    };

    readDirectory(distPath);
    console.log(`Found ${filesToUpload.length} files to upload`);

    // Helper function to upload or update a file
    const uploadFile = async (filePath, content, encoding = "base64") => {
      try {
        const body = {
          message: `Deploy: ${filePath}`,
          content:
            encoding === "utf-8"
              ? Buffer.from(content, "utf8").toString("base64")
              : content,
          encoding: "base64",
        };

        // First, try to get existing file to update it
        let existingFileData = null;
        try {
          const existingFileResponse = await fetch(
            `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
            {
              headers: {
                Authorization: `token ${githubToken}`,
                "User-Agent": "Portfolio-Generator",
              },
            }
          );

          if (existingFileResponse.ok) {
            existingFileData = await existingFileResponse.json();
            body.sha = existingFileData.sha;
            body.message = `Update: ${filePath}`;
          }
        } catch (error) {
          // File doesn't exist, proceed with create
          console.log(`File ${filePath} doesn't exist, will create new`);
        }

        const uploadResponse = await fetch(
          `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
          {
            method: "PUT",
            headers: {
              Authorization: `token ${githubToken}`,
              "Content-Type": "application/json",
              "User-Agent": "Portfolio-Generator",
            },
            body: JSON.stringify(body),
          }
        );

        if (uploadResponse.ok) {
          console.log(`✓ ${body.sha ? "Updated" : "Uploaded"}: ${filePath}`);
          return true;
        }

        // Handle SHA mismatch (409 error)
        if (uploadResponse.status === 409) {
          console.log(
            `⚠ SHA mismatch for ${filePath}, fetching latest SHA and retrying...`
          );

          try {
            // Get the latest file info
            const latestFileResponse = await fetch(
              `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
              {
                headers: {
                  Authorization: `token ${githubToken}`,
                  "User-Agent": "Portfolio-Generator",
                },
              }
            );

            if (latestFileResponse.ok) {
              const latestFileData = await latestFileResponse.json();

              // Retry with the latest SHA
              const retryBody = {
                ...body,
                sha: latestFileData.sha,
                message: `Update: ${filePath} (retry)`,
              };
              await new Promise((resolve) => setTimeout(resolve, 10000));

              ////////////////////////////////////////////////////////////////////////
              delete body.sha;
              body.message = `Create: ${filePath}`;

              const retryResponse = await fetch(
                `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `token ${githubToken}`,
                    "Content-Type": "application/json",
                    "User-Agent": "Portfolio-Generator",
                  },
                  body: JSON.stringify(retryBody),
                }
              );

              if (retryResponse.ok) {
                console.log(`✓ Updated (retry): ${filePath}`);
                return true;
              } else {
                const retryErrorText = await retryResponse.text();
                console.error(
                  `✗ Failed to update ${filePath} after retry:`,
                  retryErrorText
                );
                return false;
              }
            }
          } catch (retryError) {
            console.error(
              `✗ Error during retry for ${filePath}:`,
              retryError.message
            );
            return false;
          }
        }

        const errorText = await uploadResponse.text();
        console.error(`✗ Failed to upload ${filePath}:`, errorText);
        return false;
      } catch (error) {
        console.error(`✗ Error uploading ${filePath}:`, error.message);
        return false;
      }
    };

    // Step 7: Upload all static files with rate limiting
    console.log(`Uploading ${filesToUpload.length} static files...`);

    let uploadedCount = 0;
    // const batchSize = 5; // Upload in batches to avoid rate limiting

    // for (let i = 0; i < filesToUpload.length; i += batchSize) {
    //   const batch = filesToUpload.slice(i, i + batchSize);
    //   const uploadPromises = batch.map((file) =>
    //     uploadFile(file.path, file.content, file.encoding)
    //   );

    //   const results = await Promise.all(uploadPromises);
    //   uploadedCount += results.filter(Boolean).length;

    //   // Add delay between batches
    //   if (i + batchSize < filesToUpload.length) {
    //     await new Promise((resolve) => setTimeout(resolve, 1000));
    //   }
    // }

    for (const file of filesToUpload) {
      const success = await uploadFile(file.path, file.content, file.encoding);
      if (success) uploadedCount++;
      await new Promise((resolve) => setTimeout(resolve, 1000)); // still throttle a bit
    }

    console.log(
      `Successfully uploaded ${uploadedCount}/${filesToUpload.length} files`
    );

    // Step 8: Enable GitHub Pages
    console.log("Configuring GitHub Pages...");
    let pagesUrl = `https://${username}.github.io/${repoName}`;

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const createOrUpdatePages = async () => {
        const pagesConfig = {
          source: {
            branch: "main",
            path: "/",
          },
        };

        // Try to update first
        const updateResponse = await fetch(
          `https://api.github.com/repos/${username}/${repoName}/pages`,
          {
            method: "PUT",
            headers: {
              Authorization: `token ${githubToken}`,
              "Content-Type": "application/json",
              "User-Agent": "Portfolio-Generator",
              Accept: "application/vnd.github+json",
            },
            body: JSON.stringify(pagesConfig),
          }
        );

        if (updateResponse.ok) {
          const pagesData = await updateResponse.json();
          return pagesData.html_url;
        }

        // If update failed, try to create
        const createResponse = await fetch(
          `https://api.github.com/repos/${username}/${repoName}/pages`,
          {
            method: "POST",
            headers: {
              Authorization: `token ${githubToken}`,
              "Content-Type": "application/json",
              "User-Agent": "Portfolio-Generator",
              Accept: "application/vnd.github+json",
            },
            body: JSON.stringify(pagesConfig),
          }
        );

        if (createResponse.ok) {
          const pagesData = await createResponse.json();
          return pagesData.html_url;
        }

        return null;
      };

      const actualPagesUrl = await createOrUpdatePages();
      if (actualPagesUrl) {
        pagesUrl = actualPagesUrl;
        console.log("✓ GitHub Pages configured successfully");
      } else {
        console.log("Using default Pages URL");
      }
    } catch (pagesError) {
      console.warn("Pages configuration warning:", pagesError.message);
    }

    // Cleanup temp directory
    try {
      fs.rmSync(tempBuildPath, { recursive: true, force: true });
      fs.rmSync(templateSourcePath, { recursive: true, force: true });
      console.log("Cleaned up temporary build directory");
    } catch (cleanupError) {
      console.warn("Failed to cleanup temp directory:", cleanupError.message);
    }

    // Return success response
    return res.status(200).json({
      message: "Portfolio deployed successfully to GitHub Pages",
      repositoryUrl: repoData.html_url,
      deploymentUrl: pagesUrl,
      username: username,
      repoName: repoName,
      filesUploaded: uploadedCount,
      totalFiles: filesToUpload.length,
      status: "React app built and deployed to GitHub Pages",
      note: "Your site should be available in 2-10 minutes at the deployment URL",
      buildInfo: {
        distPath: "dist",
      },
    });
  } catch (error) {
    console.error("Deployment error:", error);
    return res.status(500).json({
      error: "Deployment failed",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export default deployToGitHubPages;
