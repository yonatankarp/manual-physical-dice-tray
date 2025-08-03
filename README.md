# ⚠️ Deprecation Notice
This module is being deprecated because its core functionality can be achieved with Foundry’s built-in settings.

What to do instead:

- GM: Go to Settings → Core → Configure Permissions and enable “Make Manual Rolls”.
- Players: Go to Settings → Core → Dice Configuration and set their dice preferences (faces, visuals, etc.).

# Manual Physical Dice – Dice Tray Button

## What it does
Adds a **Manual Physical** button next to Dice Tray so players/GMs can:
- Enter any dice expression (e.g., `1d20+5`, `2d6+1d4+3`)
- Input the actual faces they rolled on physical dice
- Show the result with a single **Dice So Nice** animation
- Control visibility (everyone / GM only / self) and add flavor text

All logic is self-contained; no separate macro setup is required.

## Prerequisites
- Foundry VTT (v13+)
- **Dice Tray** module enabled
- **Dice So Nice!** module enabled

## Quick start for players / GMs
1. Install and enable this module in your world.  
2. Ensure **Dice Tray** and **Dice So Nice!** are also enabled.  
3. In chat (where Dice Tray appears) you’ll see a **Manual Physical** button.  
4. Click it:
   - Enter the dice formula you intended to roll.
   - Provide the physical face values you actually rolled.
   - Choose who can see the result (everyone, GM only, or just you).
   - Optionally add flavor text and submit.
5. A chat card appears with the total and Dice So Nice shows the animated roll once.

## Installation (end user)
1. In Foundry: **Manage Modules → Install Module**.  
2. Paste the **manifest URL**:  `https://raw.githubusercontent.com/yonatankarp/manual-physical-dice-tray/main/module.json`
3. Install and enable the module.  
4. Enable **Dice Tray** and **Dice So Nice!** if not already active.  
5. Reload the world if needed.

## Updating
When a new version is released, Foundry will prompt you to update the module in **Manage Modules**. Just accept the update and reload the world.

## Troubleshooting
- **Button missing:**  
- Make sure the module, Dice Tray, and Dice So Nice! are all enabled.  
- Reload the world.  
- Check that you’re in a scene as a GM or user with appropriate permissions.

- **No animation / roll looks wrong:**  
- Dice So Nice! must be enabled; the chat card triggers its animation automatically.  
- Verify the formula and the physical faces entered match expectations.

- **Visibility not working:**  
- "GM only" sends a whisper to GMs; "Self" hides from others.  
- If you’re not seeing whispers, confirm user roles/permissions.

## Tips
- You can copy the chat card or create a Journal entry linking to the function if you want persistent access for players.  
- Combine with other automation or macros if you want pre-set formulas exposed via shared Journal links.
