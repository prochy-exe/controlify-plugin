import { SettingsSection } from "spcr-settings";

async function main() {
    while (!Spicetify?.showNotification) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    var retryCount = 0;

    const settings = new SettingsSection("Controlify settings", "controlify-integration");

    let socket: WebSocket | null = null;
    let heartbeatTimeout: number | null = null;

    settings.addToggle("controlify-enable", "Enable Controlify integration with Spotify!", false, () => {
        const enableControlify = settings.getFieldValue("controlify-enable");
        if (enableControlify) {
            controlifyConnect();
        } else if (!enableControlify && socket) {
            socket.close();
            console.log("WebSocket connection closed");
            socket = null;
        }
    });

    settings.addInput("controlify-retry-count", "Retry count(0 for infinite retries)", "5", () => {
        const enableControlify = settings.getFieldValue("controlify-enable");
        if (enableControlify) {
            retryCount = 0;
            controlifyConnect();
        }
    }, "number");

    settings.addInput("controlify-retry-timeout", "Retry timeout (s)", "30", () => {}, "number");

    settings.addInput("controlify-volume-steps", "Set how much the volume changes with each adjustment (out of a 100)", "2", () => {}, "number");

    settings.pushSettings();

    if (!socket && settings.getFieldValue("controlify-enable")) {
        controlifyConnect();
    }

    function resetHeartbeat() {
        if (heartbeatTimeout) {
            clearTimeout(heartbeatTimeout);
        }
        heartbeatTimeout = window.setTimeout(() => {
            console.error("Did not receive heartbeat in time, closing connection");
            if (socket) {
                socket.close();
                socket = null;
                controlifyConnect();
            }
        }, 15000); // 15 seconds grace period
    }

    type ControlifyEvent = {
        setVolume?: number;
        toggleHeart?: boolean;
        next?: boolean;
        back?: boolean;
        togglePlay?: boolean;
        play?: boolean;
        pause?: boolean;
        toggleMute?: boolean;
        toggleRepeat?: boolean;
        toggleShuffle?: boolean;
        increaseVolume?: boolean;
        decreaseVolume?: boolean;
    };

    function getEventType(event: ControlifyEvent) {
        if (event.setVolume !== undefined) return 'setVolume';
        if (event.toggleHeart !== undefined) return 'toggleHeart';
        if (event.next !== undefined) return 'next';
        if (event.back !== undefined) return 'back';
        if (event.togglePlay !== undefined) return 'togglePlay';
        if (event.play !== undefined) return 'play';
        if (event.pause !== undefined) return 'pause';
        if (event.toggleMute !== undefined) return 'toggleMute';
        if (event.toggleRepeat !== undefined) return 'toggleRepeat';
        if (event.toggleShuffle !== undefined) return 'toggleShuffle';
        if (event.increaseVolume !== undefined) return 'increaseVolume';
        if (event.decreaseVolume !== undefined) return 'decreaseVolume';
        return 'unknown';
    }

    function controlifyConnect() {
        const retryMaxCount = (settings.getFieldValue("controlify-retry-count") as number);
        const retryTimeout = (settings.getFieldValue("controlify-retry-timeout") as number) * 1000;
        socket = new WebSocket("ws://localhost:8999"); // Connect to your WebSocket server

        socket.onopen = () => {
            retryCount = 0;
            console.log("Connected to Controlify server!");

            // Send initial message with the identifier
            const initialMessage = JSON.stringify({ clientID: "spicetify-client" });
            socket?.send(initialMessage);

            resetHeartbeat();
        };

        socket.onmessage = (event: MessageEvent) => {
            if (event.data === "heartbeat") {
                resetHeartbeat();
            } else {
                const controlifyEvent: ControlifyEvent = JSON.parse(event.data);
                const eventType = getEventType(controlifyEvent);
                switch (eventType) {
                    case 'setVolume':
                        if (controlifyEvent.setVolume != null) {
                            console.log("Setting volume to", controlifyEvent.setVolume);
                            Spicetify.Player.setVolume(controlifyEvent.setVolume);
                        }
                        break;
                    case 'toggleHeart':
                        console.log("Toggling heart");
                        Spicetify.Player.toggleHeart();
                        break;
                    case 'next':
                        console.log("Skipping to next track");
                        Spicetify.Player.next();
                        break;
                    case 'back':
                        console.log("Skipping to previous track");
                        Spicetify.Player.back();
                        break;
                    case 'togglePlay':
                        console.log("Toggling play");
                        Spicetify.Player.togglePlay();
                        break;
                    case 'play':
                        console.log("Playing");
                        Spicetify.Player.play();
                        break;
                    case 'pause':
                        console.log("Pausing");
                        Spicetify.Player.pause();
                        break;
                    case 'toggleMute':
                        console.log("Toggling mute");
                        Spicetify.Player.toggleMute();
                        break;
                    case 'toggleRepeat':
                        console.log("Toggling repeat");
                        Spicetify.Player.toggleRepeat();
                        break;
                    case 'toggleShuffle':
                        console.log("Toggling shuffle");
                        Spicetify.Player.toggleShuffle();
                        break;
                    case 'increaseVolume':
                        console.log("Increasing volume");
                        Spicetify.Player.setVolume(Spicetify.Player.getVolume() + ((settings.getFieldValue("controlify-volume-steps") as number) / 100));
                        break;
                    case 'decreaseVolume':
                        console.log("Decreasing volume");
                        Spicetify.Player.setVolume(Spicetify.Player.getVolume() - ((settings.getFieldValue("controlify-volume-steps") as number) / 100));
                        break;
                    default:
                        console.log("Unknown action");
                        break;
                }
            }
        };

        socket.onclose = (event) => {
            if (event.wasClean) {
                if (settings.getFieldValue("controlify-enable") && (retryCount < retryMaxCount || retryMaxCount == 0)) {
                    retryCount++;
                    console.log("Controlify server connection closed, attempting to reconnect...");
                    console.log(`Retries: ${retryCount}/${retryMaxCount == 0 ? '\u221E' : retryMaxCount}`);
                    console.log("Waiting ", retryTimeout / 1000, "s");
                    setTimeout(controlifyConnect, retryTimeout);
                } else {
                    console.log("Controlify server connection closed");
                    socket = null;
                }
            }
        };

        socket.onerror = (error: Event) => {
            if (settings.getFieldValue("controlify-enable") && (retryCount < retryMaxCount || retryMaxCount == 0)) {
                retryCount++;
                console.log("Failed to connect to the Controlify server, retrying...");
                console.log(`Retries: ${retryCount}/${retryMaxCount == 0 ? '\u221E' : retryMaxCount}`);
                console.log("Waiting ", retryTimeout / 1000, "s");
                setTimeout(controlifyConnect, retryTimeout);
            } else {
                console.log("Failed to connect to the Controlify server");
                socket = null;
            }
        };
    }
}

export default main;