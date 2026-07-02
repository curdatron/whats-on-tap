# Whats On Tap

**A self-hosted digital beer board for pubs, bars and tap rooms.**

Whats On Tap lets venue teams maintain their drinks list from a straightforward browser-based editor and show it on any television with a web browser. It runs on a computer inside the venue and publishes the display across the local network—no account, cloud service or subscription required.

## Features

### Build the board

- Create, reorder and automatically rotate between multiple screens
- Organise each screen into reorderable sections such as Cask, Keg, Bottles or Cans
- Drag beers into the preferred order within each section
- Add beer name, brewery, style, ABV, price and an optional pump-clip image
- Add full-screen promotional image slides from an upload or hosted image address
- Delete screens, sections and individual listings
- Change the screen duration from 10 seconds to two minutes

### Keep an inventory

- Save beers for reuse across different screens
- Add an existing inventory beer without retyping its details
- Record private operational information that is not shown on the TV:
  - Container type, including custom containers
  - Container cost
  - Ordering date
  - Free-form notes

### Match the venue

- Choose background, text, accent and overlay colours
- Upload a custom background image or use a hosted image address
- Adjust background-image transparency, brightness and contrast
- Select from several display fonts
- Scale display text from 60% to 300%
- Hide the default corner icon or replace it with an uploaded or hosted venue logo
- Customise or hide the top label and footer message

### Display locally

- Open the dedicated display view in a smart-TV browser
- Share one saved board with devices on the same local network
- Automatically cycle through screens and check for updated content
- Fit pump-clip artwork without stretching it

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- A computer that can remain running while the board is displayed
- A television or display with a modern web browser
- Both devices connected to the same local network

There are no third-party runtime dependencies and no database to configure.

## Quick start

Clone or download the repository, then open a terminal in the project directory:

```bash
npm start
```

Open the editor on the host computer:

```text
http://localhost:4173
```

Open the television view:

```text
http://localhost:4173/display.html
```

The terminal also prints one or more network addresses similar to:

```text
http://192.168.1.20:4173/display.html
```

Enter that address in the TV browser. For the cleanest result, enable the browser's full-screen mode.

## Using a different port

The default port is `4173`. To use another port on macOS or Linux:

```bash
PORT=8080 npm start
```

On Windows PowerShell:

```powershell
$env:PORT=8080; npm start
```

## How publishing works

Whats On Tap starts a small HTTP server on the host computer. The editor saves the complete board to `data.json`, and every display on the local network reads from that shared file.

The TV checks for fresh data whenever it moves to the next screen. Editor changes are saved automatically; there is no separate publish button.

> [!IMPORTANT]
> Whats On Tap is designed for a trusted local network. It does not currently include user accounts or authentication. Do not expose the server directly to the public internet.

## Data and backups

All venue data is stored in the generated `data.json` file in the project directory. This file is excluded from Git so a real venue's inventory and notes are not accidentally published.

To back up the board:

1. Stop the server.
2. Copy `data.json` to a safe location.
3. Restart with `npm start`.

To move the board to another computer, copy the project and its `data.json` file, then start the app normally.

Uploaded background images are resized in the browser and stored inside the board data. Pump clips and custom corner logos supplied as web addresses still require those remote images to remain available.

## Project structure

```text
whats-on-tap/
├── public/
│   ├── index.html      # Owner editor
│   ├── app.js          # Editor, inventory and appearance controls
│   ├── display.html    # Television view
│   ├── display.js      # Display rendering and screen rotation
│   └── styles.css      # Editor and display styling
├── server.js           # Static server and shared-board API
├── package.json
└── data.json           # Generated venue data; ignored by Git
```

## Troubleshooting

### `npm` cannot find `package.json`

Run the command from inside the project directory:

```bash
cd "/path/to/whats-on-tap"
npm start
```

### The TV cannot open the display

- Confirm the TV and host computer are on the same network.
- Use the `Network:` address printed in the terminal, not `localhost`.
- Keep the terminal and host computer running.
- Check that the operating-system firewall allows Node.js to receive local connections.
- Some guest Wi-Fi networks prevent devices from communicating with each other.

### Changes do not appear immediately

The display refreshes its board data when the next screen begins. Refresh the TV browser manually if you need to see a change straight away.

### A pump clip or logo is missing

Use a direct, publicly accessible image address. Pages containing an image are not the same as the image file itself, and some websites prevent their images from being embedded elsewhere.

## Current scope

Whats On Tap is intentionally lightweight and local-first. It currently provides:

- One shared venue board
- No authentication or staff accounts
- No cloud sync or remote management
- No sales, stock-level or depletion tracking
- No automatic HTTPS configuration

These constraints keep setup simple for a computer and television on the same trusted network.

## Contributing

Issues and pull requests are welcome. Please describe the venue workflow behind a proposed change and test both the editor and the full-screen display before submitting it.

## Licence

No open-source licence has been selected yet. Until one is added, the source remains copyright-protected and is not automatically licensed for redistribution or modification.
