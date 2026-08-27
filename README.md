# Department of Mathematics - Dudhnoi College

This is a modern, static, single-page application built for the Department of Mathematics. It is specifically optimized and configured for seamless deployment on **GitHub Pages**.

## Features

- **Fully Static & GitHub Pages Ready**: All assets use correct relative paths and the Vite configuration (`base: './'`) is specifically set up to host from `https://<username>.github.io/deptmaths/`.
- **Offline & Sandbox Compatible**: Includes a local storage fallback mechanism. It stores data locally, avoiding any reliance on backend development servers, meaning it runs flawlessly on static hosts.
- **Pre-configured Routing & Caching**: Assets are versioned via Vite upon build, avoiding stale caching on GitHub Pages. The included `404.html` also handles GitHub Pages history API quirks gracefully.

## How to Deploy to GitHub Pages

If you are hosting this repository on GitHub (e.g., as `https://github.com/kandorpo/deptmaths`), follow these exact steps to deploy your website live:

### Step 1: Ensure you are logged into GitHub
Make sure this code is pushed to your `deptmaths` repository on GitHub. 
If you downloaded this as a ZIP, initialize a git repository and push it:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/kandorpo/deptmaths.git
git push -u origin main
```

### Step 2: Install Dependencies
Ensure you have Node.js installed, then run:
```bash
npm install
```

### Step 3: Deploy
We have included a specific script to automatically build and push the production-ready code to GitHub Pages.
Run the following command:
```bash
npm run deploy
```
*Behind the scenes, this runs `vite build` (creating the `dist` folder) and then pushes the `dist` folder to the `gh-pages` branch on your repository.*

### Step 4: Configure GitHub Pages Settings
1. Go to your repository on GitHub.
2. Click on **Settings** > **Pages** (on the left sidebar).
3. Under **Build and deployment**, ensure the **Source** is set to **Deploy from a branch**.
4. Under **Branch**, select **gh-pages** and the `/ (root)` folder, then click **Save**.

Within a few minutes, your fully functioning, identical website will be live at:
`https://kandorpo.github.io/deptmaths/`

## Troubleshooting

- **404 Errors / Blank White Screens**: The `vite.config.ts` file is now configured with a completely relative base path (`base: './'`). This means your website will work on ANY repository name (or even your root domain) without showing a blank white page out of the box.
- **Different Content**: By default, the site is designed to immediately fallback to the `src/data/liveData.json` which contains your customized text, faculty, and notices so that it looks exactly like the preview on any device.

