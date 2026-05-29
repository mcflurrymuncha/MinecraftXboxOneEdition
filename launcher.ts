import { spawn, ChildProcess } from 'child_process';
import * as DiscordRPC from 'discord-rpc';
import * as readline from 'readline';

// 1. CONFIGURATION
const MINECRAFT_PATH = 'Minecraft.Client.exe'; 
const CLIENT_ID = '1509897978494713926'; 

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
let rpcConnected = false;
let chosenUsername = 'Player'; // Default fallback

// Setup the console input reader
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 2. DISCORD RICH PRESENCE SETTINGS
function updateDiscordPresence(username: string) {
    if (!rpcConnected) return;

    rpc.setActivity({
        details: `Playing as ${username}`,
        state: 'Ported by Valorie',
        startTimestamp: new Date(),
        largeImageKey: 'logo',
        largeImageText: 'Minecraft: Xbox One Edition (PC v2)',
        instance: false,
    }).catch(console.error);
}

rpc.on('ready', () => {
    console.log('Connected to Discord RPC successfully!');
    rpcConnected = true;
    // Update presence if the user already entered their name before Discord connected
    if (chosenUsername !== 'Player') {
        updateDiscordPresence(chosenUsername);
    }
});

// 3. LAUNCHER CORE LOGIC
function launchGame(username: string) {
    console.log(`\nInjecting username: ${username}...`);
    console.log(`Launching ${MINECRAFT_PATH}...`);

    // Injecting name overrides straight into the environment process
    const customEnv = {
        ...process.env,
        XBOX_NICKNAME: username,
        XBOX_USERNAME: username,
        GAMERTAG: username,
        PLAYER_NAME: username,
        USER: username,
        USERNAME: username
    };

    const minecraftProcess: ChildProcess = spawn(MINECRAFT_PATH, [], {
        stdio: 'inherit',
        detached: false,
        env: customEnv 
    });

    minecraftProcess.on('error', (err) => {
        console.error(`\n❌ Error launching game: ${err.message}`);
        process.exit(1);
    });

    minecraftProcess.on('close', async (code) => {
        console.log(`\nMinecraft closed (Exit code: ${code}). Cleaning up...`);
        if (rpcConnected) {
            try {
                await rpc.destroy();
            } catch (error) {
                console.error('Error closing RPC connection:', error);
            }
        }
        process.exit(0);
    });
}

// 4. STARTUP PROMPT
function main() {
    // Spin up Discord connection in the background
    rpc.login({ clientId: CLIENT_ID }).catch((err) => {
        console.error('Could not connect to Discord RPC:', err.message);
    });

    // Ask the user for their name in the console window
    rl.question('Enter your Minecraft Username (Press Enter for "Player"): ', (answer) => {
        const trimmedName = answer.trim();
        
        if (trimmedName.length > 0) {
            chosenUsername = trimmedName;
        }

        // Close the input stream so it doesn't hang
        rl.close();

        // Update Discord card and run the game
        updateDiscordPresence(chosenUsername);
        launchGame(chosenUsername);
    });
}

main();
