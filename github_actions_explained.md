# GitHub Actions Explained (In Plain English)

Think of **GitHub Actions** as an invisible robot butler that lives inside your GitHub repository.

Whenever you trigger a specific physical event (like typing `git push`), the robot looks at a blueprint you gave it, perfectly executes a sequence of commands on a temporary computer in the cloud, and then destroys that temporary computer.

---

## How It Works in *This* Project

You just ran `git push -f origin main`. That was the "trigger event."

When that push arrived at GitHub, the robot woke up, went into the `.github/workflows/deploy.yml` file I created for you, and basically read these instructions:

1. **"Wake up a fresh Linux computer in the cloud."**
2. **"Download all of Victor's code from this repository onto that computer."**
3. **"Install the exact version of Node.js we need."**
4. **"Run `npm install` to download all the coding packages (like D3.js and Vite)."**
5. **"Run `npm run build` to package, compress, and minify the entire website into a tiny, hyper-fast `dist` folder."**
6. **"Take that `dist` folder and publish it live to the internet using GitHub Pages."**
7. **"Turn off the computer."**

Without GitHub Actions, **you** would have had to do step 5 on your local Mac, generate a messy `dist` folder, explicitly commit that `dist` folder to git, and then configure GitHub to look at that folder. By using the robot, your code stays perfectly clean. You only upload the *source code*, and the robot handles the messy construction and publishing behind the scenes.

---

## Why Didn't We Use Them in Your Other Projects?

If you look back at your other recent Antigravity projects, you'll see why we didn't need this robot butler:

**1. The Chrome Extension (Drive Tagger)**
We built that in Vanilla JavaScript and HTML, but Chrome extensions run *locally on your computer*. There is no server. You just load the folder into your Chrome browser. We didn't need the internet to serve the files, so we didn't need a robot to build and publish them.

**2. Next.js / React Apps (Zen Garden, Coalition Builder)**
For those projects, you likely used **Vercel** or **Netlify** to host them.
Vercel is literally built by the creators of Next.js. When you connect a GitHub repo to Vercel, Vercel *already has its own built-in robot*. It watches your GitHub repo, and the second it sees a push, Vercel magically builds and deploys it on its own servers. 

**3. Simple HTML/CSS Projects**
Sometimes a website is just a flat `index.html` file and a `style.css` file with zero complex javascript tools. In those cases, GitHub Pages can just blindly serve the file as-is without needing anything to be "built" or compiled first.

**In this Epstein Visualization Project:**
Because we used **Vite** (a modern build tool) to bundle up all our Javascript modules, raw data files, and NPM packages (like D3 and Fuse.js), the code couldn't just be blindly served as an `index.html` file. It absolutely *had* to be compiled through the `npm run build` process first to run in a browser. 

I set up GitHub Actions so that you never have to think about the compilation. You just hit `git push`, and the robot does the rest!
