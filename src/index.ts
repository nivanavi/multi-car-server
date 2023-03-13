import WebSocket from 'ws';
import dotenv from 'dotenv';
import {Player, WebsocketMessages} from "./types";

dotenv.config();

const port = Number(process.env.PORT);

const wsServer = new WebSocket.Server({port});
const clients = new Map<WebSocket, Player>();

const setRoot = (roomId: string) => {
    let isAlreadyHaveBallRoot: boolean = false;
    const clientsInThisRoom: WebSocket[] = [...clients.keys()].reduce<WebSocket[]>((clientsInRoom, clientWs) => {
        const currentClient = clients.get(clientWs);
        const {roomId: clientRoomId, isRoot} = currentClient || {};
        if (!currentClient || !roomId || clientRoomId !== roomId) return clientsInRoom;
        if (isRoot) isAlreadyHaveBallRoot = true;
        clientsInRoom.push(clientWs);
        return clientsInRoom;
    }, []);
    if (isAlreadyHaveBallRoot || clientsInThisRoom.length === 0) return;
    const nextBallRootInThisRoom = clients.get(clientsInThisRoom[0]);
    if (!nextBallRootInThisRoom) return;
    nextBallRootInThisRoom.isRoot = true;
}
const connectHandler = (ws: WebSocket) => {
    ws.on('message', rawMessage => {
        const message: WebsocketMessages = JSON.parse(String(rawMessage));
        const {action, payload: {id: messagePlayerId, roomId: messageRoomId, nickname: messageNickname}} = message || {};

        const currentPlayer = clients.get(ws);

        switch (action) {
            case "CONNECT":
                clients.set(ws, {
                    id: messagePlayerId,
                    roomId: messageRoomId,
                    nickname: messageNickname || messagePlayerId,
                    isRoot: false
                });
                setRoot(messageRoomId);
                [...clients.keys()].forEach(client => {
                    const currentClient = clients.get(client);
                    const {id, roomId} = currentClient || {};
                    if (!id || !roomId) return;
                    if (id === messagePlayerId || roomId !== messageRoomId) return;
                    client.send(JSON.stringify(message));
                })
                break;
            case "CHARACTER_DELETE":
            case "CHARACTER_SHOT":
            case "CHARACTER_DAMAGED":
                [...clients.keys()].forEach(client => {
                    const currentClient = clients.get(client);
                    const {id, roomId} = currentClient || {};
                    if (!id || !roomId) return;
                    if (id === messagePlayerId || roomId !== messageRoomId) return;
                    client.send(JSON.stringify(message));
                })
                break;
            case "CLIENT_SYNC":
                [...clients.keys()].forEach(client => {
                    const currentClient = clients.get(client);
                    const {id, roomId} = currentClient || {};
                    if (!id || !roomId || !currentPlayer) return;
                    if (id === messagePlayerId || roomId !== messageRoomId) return;
                    client.send(JSON.stringify({
                        ...message,
                        payload: {
                            ...message.payload,
                            ball: currentPlayer.isRoot ? message.payload.ball : undefined,
                        }
                    }));
                })
                break;
        }
    });

    ws.on('close', () => {
        const currentPlayer = clients.get(ws);
        const {id: wsId, roomId: wsRoomId, nickname: wsNickname, isRoot} = currentPlayer || {};

        if (!wsId || !wsRoomId) return;

        [...clients.keys()].forEach(client => {
            const currentClient = clients.get(client);
            const {id, roomId} = currentClient || {};
            if (!id || !roomId) return;
            if (id === wsId || roomId !== wsRoomId) return;
            client.send(JSON.stringify({
                action: 'DISCONNECT',
                payload: {
                    id: wsId,
                    roomId: wsRoomId,
                    nickname: wsNickname
                }
            }));
        })

        clients.delete(ws);

        if (isRoot && clients.size !== 0) setRoot(wsRoomId);
    });
};

wsServer.on('connection', connectHandler);
console.log(`Сервер запущен на ${port} порту`);
