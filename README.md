# YouTube Caption Override

Chrome extension that forces YouTube captions to use your chosen position, size, color, and background opacity.

## Install it

1. Download this project and unzip it if needed.
2. Open Chrome and enter `chrome://extensions` in the address bar.
3. Turn on **Developer mode** in the upper-right corner.
4. Choose **Load unpacked**.
5. Select the project folder (the folder containing `manifest.json`).

Chrome will add a **YouTube Caption Override** icon to your extensions. You can pin it from the puzzle-piece menu for easier access.

## Use it

1. Open a YouTube video and turn captions on with YouTube's normal **CC** button.
2. Select the extension icon.
3. Choose the caption position, font size, text color, and background opacity you want.

Changes are saved automatically and should appear on an already-playing video right away. The same settings are used on future YouTube videos and sync to other Chrome browsers where you use the same Google account and have extension sync enabled.

The extension does not replace YouTube's caption system. The video's normal **CC** button still turns captions on and off.

## Current scope

- Works on `youtube.com/watch` video pages in normal, theater, and fullscreen modes.
- Uses several caption selectors because YouTube's internal page structure is not a public API and can change.
- Overrides rendered captions only; it does not download, parse, or alter caption files.

## Troubleshooting

- If settings do not appear after installing or updating the extension, refresh the open YouTube tab once.
- Make sure captions are enabled for the video.
- If YouTube changes its caption markup, the selectors in `content.js` may need to be updated.
