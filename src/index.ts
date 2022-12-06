import WebSocket from 'ws';
import { v4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT);

const wsServer = new WebSocket.Server({ port });
const clients = new Map();
const connectHandler = (ws: WebSocket) => {
	const id = v4();
	const color = Math.floor(Math.random() * 360);
	const initialMetadata = { id, color };

	clients.set(ws, initialMetadata);

	ws.on('message', rawMessage => {
		const message = JSON.parse(String(rawMessage));
		const metadata = clients.get(ws);
		message.sender = metadata.id;

		const outbound = JSON.stringify(message);

		[...clients.keys()].forEach(client => {
			client.send(outbound);
		});
	});

	ws.on('close', () => {
		const metadata = clients.get(ws);
		const message = JSON.stringify({
			action: 'CAR_DELETE',
			data: JSON.stringify({
				id: metadata.id,
			}),
		});
		[...clients.keys()].forEach(client => {
			client.send(message);
		});
		clients.delete(ws);
	});
};

wsServer.on('connection', connectHandler);
console.log(`Сервер запущен на ${port} порту`);
