# Poop Deck Pirates
Available at https://www.poopdeckpirates.com/, or by hosting on a local machine.

## Quick-Start Guide
To run the game on your local machine:
  1. Clone the repository and navigate to the PirateGame directory. Note this may look like `pirategame/pirategame` depending on where you cloned the repository.
  2. Run `npm install` to update and install all dependencies in the `package.json` file.
  3. Launch the server with `npm start` and access the game at `localhost:3000`.

## Development Guide
If making changes to the game:
  1. Clone the repository and open in an IDE like VSCode or equivalent.
  2. Run `npm install` to update and install all dependencies.
  3. Execute `npm run build:all` to compile all TypeScript files. This step is necessary to convert TypeScript code to JavaScript that can run in the browser and on the server.
  4. Make any changes required, push to a separate branch and make a pull request.

## NPM Scripts
To execute these, enter `npm run` then the name of the script:
  - `clean` - Deletes the contents of all /browser and /built directories.
  - `build:shared` - Builds only the shared/ directory into /shared/built (for the server) and /shared/browser (for the client).
  - `build:server` - Builds only the server/ directory into /server/built.
  - `build:all` - Executes the two build scripts above. This may take some time- the TypeScript compiler is notoriously slow.
  - `start` - Executes the above, then starts server/built/server.js with the @shared path alias.
  - `dev`- Builds all directories, then automatically re-compiles and restarts the server when code is edited. This is useful for development as it saves you from manually rebuilding and restarting the server.

## Troubleshooting
If you encounter issues:
  - Ensure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).
  - Make sure you are in the correct directory when running commands.
  - If you see errors about missing modules, try deleting the `node_modules` directory and running `npm install` again.
