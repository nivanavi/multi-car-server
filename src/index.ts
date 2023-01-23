import WebSocket from 'ws';
import dotenv from 'dotenv';
import {Player, WebsocketMessages} from "./types";

dotenv.config();

const port = Number(process.env.PORT);

const wsServer = new WebSocket.Server({port});
const clients = new Map<WebSocket, Player>();

const connectHandler = (ws: WebSocket) => {
    ws.on('message', rawMessage => {
        const message: WebsocketMessages = JSON.parse(String(rawMessage));
        const {action, payload: {carId: messageCarId, roomId: messageRoomId, nickname: messageNickname}} = message || {};

        const currentPlayer = clients.get(ws);

        switch (action) {
            case "CAR_CONNECTED":
                const isBallRoot = clients.size === 0;
                clients.set(ws, {
                    carId: messageCarId,
                    roomId: messageRoomId,
                    nickname: messageNickname || messageCarId,
                    isBallRoot
                });
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
                if (!currentPlayer || !currentPlayer.isBallRoot) return;
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
        const currentPlayer = clients.get(ws);
        const {carId: wsCarId, roomId: wsRoomId, nickname: wsNickname, isBallRoot} = currentPlayer || {};

        if (!wsCarId || !wsRoomId) return;

        [...clients.keys()].forEach(client => {
            const currentClient = clients.get(client);
            const {carId, roomId} = currentClient || {};
            if (!carId || !roomId) return;
            if (carId === wsCarId || roomId !== wsRoomId) return;
            client.send(JSON.stringify({
                action: 'CAR_DELETE',
                payload: {
                    carId: wsCarId,
                    roomId: wsRoomId,
                    nickname: wsNickname
                }
            }));
        })

        clients.delete(ws);

        if (isBallRoot && clients.size !== 0) {
            const [firstPlayerWs] = clients.entries().next().value as [ws: WebSocket | undefined];

            const firstPlayer = firstPlayerWs ? clients.get(firstPlayerWs) : undefined;
            if (firstPlayer) firstPlayer.isBallRoot = true;
        }
    });
};

wsServer.on('connection', connectHandler);
console.log(`Сервер запущен на ${port} порту`);
