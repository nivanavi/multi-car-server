import WebSocket from 'ws';
import dotenv from 'dotenv';
import {WebsocketMessages} from "./types";

dotenv.config();

const port = Number(process.env.PORT);

const wsServer = new WebSocket.Server({port});
const clients = new Map<WebSocket, { carId: string, roomId: string }>();

const connectHandler = (ws: WebSocket) => {
    ws.on('message', rawMessage => {
        const message: WebsocketMessages = JSON.parse(String(rawMessage));
        const {action, payload: {carId: messageCarId, roomId: messageRoomId}} = message || {};

        switch (action) {
            case "CAR_CONNECTED":
                clients.set(ws, {carId: messageCarId, roomId: messageRoomId});
                [...clients.keys()].forEach(client => {
                    const currentClient = clients.get(client);
                    const {carId, roomId} = currentClient || {};
                    if (!carId || !roomId) return;
                    if (carId === messageCarId || roomId !== messageRoomId) return;
                    client.send(JSON.stringify(message));
                })
                break;
            case "CAR_MOVE":
                [...clients.keys()].forEach(client => {
                    const currentClient = clients.get(client);
                    const {carId, roomId} = currentClient || {};
                    if (!carId || !roomId) return;
                    if (carId === messageCarId || roomId !== messageRoomId) return;
                    client.send(JSON.stringify(message));
                })
                break;
            case "BALL_MOVE":
                [...clients.keys()].forEach(client => {
                    const currentClient = clients.get(client);
                    const {carId, roomId} = currentClient || {};
                    if (!carId || !roomId) return;
                    if (carId === messageCarId || roomId !== messageRoomId) return;
                    client.send(JSON.stringify(message));
                })
                break;
        }
    });

    ws.on('close', () => {
        const currentWs = clients.get(ws);
        const {carId: wsCarId, roomId: wsRoomId} = currentWs || {};
        if (!wsCarId || !wsRoomId) return;

        [...clients.keys()].forEach(client => {
            const currentClient = clients.get(client);
            const {carId, roomId} = currentClient || {};
            if (!carId || !roomId) return;
            if (carId === wsCarId || roomId !== wsRoomId) return;
            client.send(JSON.stringify({
                action: 'CAR_DELETE',
                payload: {
                    carId: wsCarId
                }
            }));
        })

        clients.delete(ws);
    });
};

wsServer.on('connection', connectHandler);
console.log(`Сервер запущен на ${port} порту`);
