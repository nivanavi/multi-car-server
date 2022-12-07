export type WebsocketMessages = {
	action: 'CAR_MOVE' | 'CAR_DELETE' | 'CAR_CONNECTED',
	payload: {id: string}
}