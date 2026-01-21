# Quick Start Guide for Non-Coders

This guide will help you get the Chess Progress Tracker running on your computer, even if you've never coded before.

## Step 1: Check if Python is Installed

### On Windows:
1. Press the `Windows` key on your keyboard
2. Type `cmd` and press Enter (this opens the Command Prompt)
3. Type `python --version` and press Enter
4. If you see something like "Python 3.11.0" or any version 3.7+, you're good! Skip to Step 3.
5. If you see an error, continue to Step 2.

### On Mac:
1. Press `Command` + `Space` to open Spotlight
2. Type `terminal` and press Enter
3. Type `python3 --version` and press Enter
4. If you see something like "Python 3.11.0" or any version 3.7+, you're good! Skip to Step 3.
5. If you see an error, continue to Step 2.

### On Linux:
1. Open Terminal (usually Ctrl+Alt+T)
2. Type `python3 --version` and press Enter
3. If you see version 3.7 or higher, you're good! Skip to Step 3.
4. If not, continue to Step 2.

## Step 2: Install Python (if needed)

1. Go to https://www.python.org/downloads/
2. Click the big yellow "Download Python" button
3. Run the downloaded installer
4. **IMPORTANT**: Check the box that says "Add Python to PATH" at the bottom of the installer
5. Click "Install Now"
6. Wait for installation to complete
7. Go back to Step 1 to verify it worked

## Step 3: Download the Project

If you're reading this file, you probably already have the project! It should be in a folder called `Octo-umbrella`.

**Note the location** of this folder. For example:
- Windows: `C:\Users\YourName\Octo-umbrella`
- Mac/Linux: `/home/YourName/Octo-umbrella`

## Step 4: Open Terminal/Command Prompt in the Project Folder

### On Windows:
1. Open File Explorer
2. Navigate to the `Octo-umbrella` folder
3. Click in the address bar at the top
4. Type `cmd` and press Enter
5. A black window should open - this is the Command Prompt

### On Mac:
1. Open Finder
2. Navigate to the `Octo-umbrella` folder
3. Right-click on the folder
4. Hold down the `Option` key
5. Click "Copy 'Octo-umbrella' as Pathname"
6. Open Terminal (Command+Space, type "terminal")
7. Type `cd ` (with a space after cd)
8. Press `Command+V` to paste the path
9. Press Enter

### On Linux:
1. Navigate to the `Octo-umbrella` folder in your file manager
2. Right-click in the folder
3. Select "Open Terminal Here" (or similar option)

## Step 5: Install Required Software

In the terminal/command prompt window, type this command and press Enter:

**Windows:**
```
pip install -r requirements.txt
```

**Mac/Linux:**
```
pip3 install -r requirements.txt
```

You'll see some text scrolling by. Wait for it to finish (you'll see the cursor blinking again when it's done).

This installs Flask (the web framework) and requests (for talking to chess.com).

## Step 6: Start the Application

In the same terminal window, type:

**Windows:**
```
python app.py
```

**Mac/Linux:**
```
python3 app.py
```

You should see some messages ending with something like:
```
* Running on http://0.0.0.0:5000
```

**Don't close this window!** The application needs to keep running.

## Step 7: Open the Application in Your Browser

1. Open your web browser (Chrome, Firefox, Safari, Edge, etc.)
2. In the address bar, type: `localhost:5000`
3. Press Enter
4. You should see the Chess Progress Tracker dashboard!

## Step 8: Using the Application

### First Time Setup:
1. Click on "Import Games" at the top
2. Enter your chess.com username (just the username, not your email)
3. Leave Year and Month empty (it will use the current month)
4. Click "Import Games"
5. Wait a few seconds - your games will be imported!

### Analyzing a Game:
1. Go back to the Dashboard (click "Dashboard" at the top)
2. You'll see a list of your recent games
3. Click "Analyze" next to any game
4. Fill in:
   - **Loss Reason**: What went wrong? (e.g., "Blundered my queen", "Time pressure")
   - **Learning Recommendations**: What should you study? (e.g., "Practice knight tactics", "Study Sicilian Defense")
   - **Notes**: Any other thoughts about the game
5. Click "Save Analysis"

### Viewing Your Progress:
1. Click "Statistics" at the top
2. You'll see:
   - Your win rate
   - Current rating
   - A graph showing your rating over time
   - Most common reasons you lose
   - What you should study most

## Stopping the Application

When you're done using the app:
1. Go back to the terminal/command prompt window
2. Press `Ctrl+C` (on Windows/Linux) or `Command+C` (on Mac)
3. The application will stop
4. You can close the terminal window

## Starting the Application Again Later

1. Open terminal/command prompt in the `Octo-umbrella` folder (see Step 4)
2. Run the command from Step 6
3. Open `localhost:5000` in your browser

Your data is saved! All your games and analysis are stored in a file called `chess_progress.db` in the folder.

## Troubleshooting

### "Command not found" or "'python' is not recognized"
- Make sure Python is installed (see Steps 1-2)
- Try using `python3` instead of `python` (especially on Mac/Linux)
- On Windows, make sure you checked "Add Python to PATH" during installation

### "No module named flask"
- You need to run the command from Step 5 first
- Make sure you're in the correct folder when running the command

### "Address already in use"
- Something else is using port 5000
- Try changing port 5000 to 5001 in the `app.py` file on the last line
- Then use `localhost:5001` in your browser

### Games not importing
- Make sure your chess.com profile is public
- Check that you spelled your username correctly
- Make sure you have games in the selected month

### Browser shows "This site can't be reached"
- Make sure the application is still running (check the terminal window)
- Make sure you typed `localhost:5000` (not `localhost5000` or anything else)
- Try `127.0.0.1:5000` instead

## Getting Help

If you're stuck:
1. Take a screenshot of any error messages
2. Note what step you're on
3. Check the main README.md file for more details

## Tips for Best Results

- **Import regularly**: Import your games after each session while they're fresh in your mind
- **Be specific**: When analyzing losses, be as specific as possible about what went wrong
- **Review patterns**: Check the Statistics page weekly to see what you should focus on
- **Set goals**: Use the learning recommendations to create a study plan

Enjoy tracking your chess progress!
