export type WebsocketMessages = {
	action: 'DISCONNECT' | 'CONNECT' | 'CLIENT_SYNC' | 'CHARACTER_DELETE' | 'CHARACTER_DAMAGED' | 'CHARACTER_SHOT',
	payload: {id: string, roomId: string, nickname: string, car?: object, person?: object, ball?: object}
}

export type Player = {
	id: string
	roomId: string
	nickname: string
	isRoot: boolean
}