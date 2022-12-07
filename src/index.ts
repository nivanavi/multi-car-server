import WebSocket from 'ws';
import dotenv from 'dotenv';
import {WebsocketMessages} from "./types";

dotenv.config();

const port = Number(process.env.PORT);

const wsServer = new WebSocket.Server({port});
const clients = new Map<WebSocket, { id: string }>();

const connectHandler = (ws: WebSocket) => {
    ws.on('message', rawMessage => {
        const message: WebsocketMessages = JSON.parse(String(rawMessage));

        switch (message.action) {
            case "CAR_CONNECTED":
                clients.set(ws, {id: message?.payload?.id});
                [...clients.keys()].forEach(client => {
                    const currentClient = clients.get(client);
                    if (!currentClient?.id || currentClient.id === message?.payload?.id) return;
                    client.send(JSON.stringify(message));
                })
                break;
            case "CAR_MOVE":
                [...clients.keys()].forEach(client => {
                    const currentClient = clients.get(client);
                    if (!currentClient?.id || currentClient.id === message?.payload?.id) return;
                    client.send(JSON.stringify(message));
                })
                break;
        }
    });

    ws.on('close', () => {
        const currentWs = clients.get(ws);
        if (!currentWs?.id) return;

        [...clients.keys()].forEach(client => {
            const currentClient = clients.get(client);
            if (!currentClient?.id || currentClient.id === currentWs.id) return;
            client.send(JSON.stringify({
                action: 'CAR_DELETE',
                payload: {
                    id: currentWs.id
                }
            }));
        })

        clients.delete(ws);
    });
};

wsServer.on('connection', connectHandler);
console.log(`Сервер запущен на ${port} порту`);
