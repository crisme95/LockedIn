# Locked-In

Chrome Extension to help you Lock In and stay productive.

---

## WorkFlow

**Board:**  
[Project Board](https://github.com/users/MEKNOWKNOOB/projects/1/views/1)

---

# Locked-In: Development and User Guide

Welcome to **Locked-In**, a Chrome extension designed to help you stay focused and productive by managing your time and blocking distracting websites. This guide will walk you through deploying the extension in your browser and using its features effectively.

---

## Deployment Guide

To get started with the "Locked-In" extension, you'll need to load it into a Chromium-based browser like Google Chrome or Brave. Since it's not yet packaged for the Chrome Web Store, you'll load it as an **unpacked extension**.

### Steps:

1. **Download the Files:**  
    Ensure you have the entire `Locked-In` folder, including `manifest.json`, HTML, CSS, and scripts, saved on your computer.

2. **Open Browser Extensions:**  
    - In Chrome: Go to `chrome://extensions`  
    - In Brave: Go to `brave://extensions`

3. **Enable Developer Mode:**  
    - Toggle "Developer mode" (usually top-right).

4. **Load the Extension:**  
    - Click **Load unpacked**.
    - Select the `Locked-In` folder and click **Select Folder**.

5. **Ready to Go!**  
    - The extension should now appear in your extensions list and its icon will be added to your browser's toolbar. You can pin the extension to the toolbar for easier access.

---

## User Guide

Now that the extension is installed, here’s how to use its features to "lock in" and get work done.

### Main Interface

Click the extension's icon in your toolbar to open the main popup window. The interface includes:

- **Home:** Main timer page.
- **Task Manager:** To-do list for organizing tasks.
- **StatTrak:** View statistics from your work sessions.
- **Settings:** Configure distracting sites and other options.

---

### Timer

- **Set the Timer:**  
  Choose your session duration using the hours, minutes, and seconds fields.

- **Start a Session:**  
  Click **Start** to begin. Distracting websites will be blocked.

- **Breaks:**  
  Click **Break** to pause and regain access to all sites.  
  Click **Continue** to resume.  
  Click **Stop?** to end the session.

---

### Task Manager

- **Add Tasks:**  
  Type a new task and click **+** to add it.

- **Subtasks:**  
  Add subtasks for complex tasks.

- **Edit/Delete:**  
  Edit tasks directly. Click **✕** to delete. Tasks are saved automatically.

---

### StatTrak

- **Productivity Breakdown:**  
  See time spent on productive vs. distracting sites.

- **Visual Feedback:**  
  Color-coded bar graph (green = productive, red = distracting).

- **Session Duration:**  
  View total duration of your last session.

---

### Settings

- **Manage Distracting Sites:**  
  - **Manual Blocking:** Add sites by URL.
  - **Context Menu:** Right-click any page and select "Mark as Distracting".
  - **Remove Sites:** Click **Delete** next to a domain.

- **Set an Unlock PIN:**  
  Set a 4-digit PIN to restrict access to distracting sites during sessions.

---

### The Locking Feature

- **How it Works:**  
  During a session, the extension monitors your tabs. Visiting a blocked site redirects you to a "Tab Locked" page.

- **Unlocking a Tab:**  
  Enter your PIN to gain temporary access to the site.
