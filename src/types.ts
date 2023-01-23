export type WebsocketMessages = {
	action: 'CAR_MOVE' | 'CAR_DELETE' | 'CAR_CONNECTED' | 'BALL_MOVE',
	payload: {carId: string, roomId: string, nickname: string}
}

export type Player = {
	carId: string
	roomId: string
	nickname: string
	isBallRoot: boolean
}