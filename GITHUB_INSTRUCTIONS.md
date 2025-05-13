# GitHub Repository Setup Instructions

Follow these steps to push this code to your own GitHub repository:

## 1. Create a New Repository on GitHub

1. Go to [GitHub](https://github.com) and sign in to your account
2. Click the "+" icon in the top-right corner and select "New repository"
3. Name the repository "voice-agent"
4. Add a description (optional): "A modern web application for voice conversations with AI using VAPI"
5. Choose visibility (public or private)
6. Do NOT initialize the repository with a README, .gitignore, or license
7. Click "Create repository"

## 2. Push Your Code to GitHub

After creating the repository, GitHub will show you commands to push an existing repository. Use these commands:

```bash
# Navigate to your project directory
cd /path/to/voice-chat-app

# Set the remote URL (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/voice-agent.git

# Push your code to GitHub
git push -u origin voice-agent-app
```

## 3. Set Default Branch (Optional)

If you want to set the `voice-agent-app` branch as the default:

1. Go to your repository on GitHub
2. Click "Settings"
3. Click "Branches" in the left sidebar
4. Under "Default branch", click the dropdown and select "voice-agent-app"
5. Click "Update"
6. Confirm the change

## 4. Additional Information

- The code is already committed with the message "Initial commit: Voice Agent application with modern UI"
- A `.gitignore` file has been created to exclude unnecessary files
- All necessary files for the application are included in the repository