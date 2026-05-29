import { spawn, ChildProcess } from 'child_process';
import * as DiscordRPC from 'discord-rpc';

// 1. CONFIGURATION
// If your exe is in a subfolder, update this path (e.g., '.\\game\\minecraft.client.exe')
const MINECRAFT_PATH = 'Minecraft.Client.exe'; 
const CLIENT_ID = '1509897978494713926'; 

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
let rpcConnected = false;

// 2. DISCORD RICH PRESENCE SETTINGS
rpc.on('ready', () => {
    console.log('Connected to Discord RPC successfully!');
    rpcConnected = true;
    
    // Set what displays on your Discord profile card
    rpc.setActivity({
        details: 'Playing',
        state: 'Ported by Valorie',
        startTimestamp: new Date(), // This creates the "elapsed time" timer
        largeImageKey: 'logo',      // Matches the asset key name in your Discord Developer Portal
        largeImageText: 'Minecraft: Xbox One Edition',
        instance: false,
    }).catch(console.error);
});

// 3. LAUNCHER CORE LOGIC
function launchGame() {
    console.log('Connecting to Discord...');
    rpc.login({ clientId: CLIENT_ID }).catch((err) => {
        console.error('Could not connect to Discord RPC (Is Discord running?):', err.message);
    });

    console.log(`Launching ${MINECRAFT_PATH}...`);
    // Launches Minecraft in the same directory
    const minecraftProcess: ChildProcess = spawn(MINECRAFT_PATH, [], {
        stdio: 'inherit',
        detached: false
    });

    // Handle errors if the Minecraft executable isn't found
    minecraftProcess.on('error', (err) => {
        console.error(`\nError launching game: ${err.message}`);
        console.error(`Make sure this launcher is placed in the exact same folder as "${MINECRAFT_PATH}"!\n`);
        process.exit(1);
    });

    // Listen for Minecraft to close
    minecraftProcess.on('close', async (code) => {
        console.log(`\nMinecraft closed (Exit code: ${code}). Cleaning up...`);
        
        // Disconnect from Discord cleanly so the status disappears immediately
        if (rpcConnected) {
            try {
                await rpc.destroy();
                console.log('Discord RPC connection closed.');
            } catch (error) {
                console.error('Error closing RPC connection:', error);
            }
        }
        
        process.exit(0);
    });
}

launchGame();
