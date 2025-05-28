// import fetch from "node-fetch";

// export const githubOAuthCallback = async (req, res) => {
//   const code = req.query.code;
//   const state = req.query.state; // The original page on the frontend
//   const redirectUrl = decodeURIComponent(state || "http://localhost:5173");

//   if (!code) return res.redirect(`${redirectUrl}?error=NoCode`);

//   try {
//     const tokenRes = await fetch(
//       "https://github.com/login/oauth/access_token",
//       {
//         method: "POST",
//         headers: {
//           Accept: "application/json",
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           client_id: process.env.GITHUB_CLIENT_ID,
//           client_secret: process.env.GITHUB_CLIENT_SECRET,
//           code,
//         }),
//       }
//     );

//     const tokenData = await tokenRes.json();
//     const accessToken = tokenData.access_token;

//     if (!accessToken) {
//       return res.redirect(`${redirectUrl}?error=AccessTokenFailed`);
//     }

//     // Redirect back to frontend, include token in query params (or handle another way)
//     return res.redirect(`${redirectUrl}?token=${accessToken}`);
//   } catch (err) {
//     console.error("GitHub OAuth Error:", err);
//     return res.redirect(`${redirectUrl}?error=OAuthFailed`)
// ;
//   }
// };

// export default githubOAuthCallback;

// import fetch from "node-fetch";

// export const githubOAuthCallback = async (req, res) => {
//   const code = req.query.code;
//   const state = req.query.state; // The original page on the frontend
//   const redirectUrl = decodeURIComponent(state || "http://localhost:5173");

//   if (!code) return res.redirect(`${redirectUrl}?error=NoCode`);

//   try {
//     const tokenRes = await fetch(
//       "https://github.com/login/oauth/access_token",
//       {
//         method: "POST",
//         headers: {
//           Accept: "application/json",
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           client_id: process.env.GITHUB_CLIENT_ID,
//           client_secret: process.env.GITHUB_CLIENT_SECRET,
//           code,
//         }),
//       }
//     );

//     const tokenData = await tokenRes.json();
//     const accessToken = tokenData.access_token;

//     if (!accessToken) {
//       return res.redirect(`${redirectUrl}?error=AccessTokenFailed`);
//     }

//     // Get user info to validate the token
//     const userResponse = await fetch("https://api.github.com/user", {
//       headers: {
//         Authorization: `token ${accessToken}`,
//         "User-Agent": "Portfolio-Generator",
//       },
//     });

//     if (!userResponse.ok) {
//       return res.redirect(`${redirectUrl}?error=InvalidToken`);
//     }

//     const userData = await userResponse.json();

//     // Store token in session or return it to frontend
//     // For security, you might want to store this server-side and return a session ID
//     // For now, returning token to frontend (consider security implications)
//     return res.redirect(`${redirectUrl}?token=${accessToken}&username=${userData.login}`);
//   } catch (err) {
//     console.error("GitHub OAuth Error:", err);
//     return res.redirect(`${redirectUrl}?error=OAuthFailed`);
//   }
// };

// export default githubOAuthCallback;

import fetch from "node-fetch";

export const githubOAuthCallback = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state; // The original page on the frontend
  const redirectUrl = decodeURIComponent(state || "http://localhost:5173");

  if (!code) return res.redirect(`${redirectUrl}?error=NoCode`);

  try {
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.redirect(`${redirectUrl}?error=AccessTokenFailed`);
    }

    // Get user info to validate the token
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
        "User-Agent": "Portfolio-Generator",
      },
    });

    if (!userResponse.ok) {
      return res.redirect(`${redirectUrl}?error=InvalidToken`);
    }

    const userData = await userResponse.json();

    // Store token in session or return it to frontend
    // For security, you might want to store this server-side and return a session ID
    // For now, returning token to frontend (consider security implications)
    return res.redirect(
      `${redirectUrl}?token=${accessToken}&username=${userData.login}`
    );
  } catch (err) {
    console.error("GitHub OAuth Error:", err);
    return res.redirect(`${redirectUrl}?error=OAuthFailed`);
  }
};

export default githubOAuthCallback;
