import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from 'src/room/room.service';

@WebSocketGateway({cors: { origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true }, namespace: 'comment'}) //comment를 받을 클래스
export class CommentGateway {
  constructor(private readonly roomService: RoomService) { }
  
  @WebSocketServer() server: Server;

  @SubscribeMessage('addComment')
  handleMessage(socket: Socket, data: any): void {
    //코멘트, 시간, 코멘트 남긴 유저
    const { visitorcode, time, userId, comment } = data;

    //room DB에 저장
    this.roomService.addCommentToRoom(data);
  }
}

@WebSocketGateway({ cors: { origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true }, namespace: 'room' })
export class RoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{
  constructor(
    private readonly commentGateway: CommentGateway,
    private readonly roomService: RoomService,) { }
  rooms = [];

  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    console.log('WebSocket server initialized.');
  }

  handleConnection(socket: Socket) {
    console.log(`Client connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    console.log(`Client disconnected: ${socket.id}`);
  }

  @SubscribeMessage('createRoom')
  async handleMessage(@ConnectedSocket() socket, @MessageBody() data) {
    //방을 생성한 사람의 ID
    const { userId } = data;

    //참관코드 생성 및 DB 관련 작업
    const room = await this.roomService.createRoom(userId);
    this.rooms.push(room);

    //방장이 방에 입장하도록 한다.
    socket.join(room); 
    console.log("createRoom join: ",room, userId);
    socket.emit("create-succ", room); //참관코드 전송
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() socket, @MessageBody() data) {
    const { visitorcode, userId } = data;

    socket.join(visitorcode);
    console.log("joinRoom join : ",visitorcode, userId);
    socket.emit("join-succ", "입장");
  }

  // @SubscribeMessage('exitRoom')
  // handleExitRoom(@ConnectedSocket() socket, @MessageBody() data) {
  //   const { visitorcode, userId } = data;

  //   socket.leave(visitorcode);
  //   console.log(visitorcode, userId);
  //   socket.emit("exit-succ", "퇴장");
  // }

  @SubscribeMessage('offer')
  handleOffer(@ConnectedSocket() socket, @MessageBody() data) {
    const { visitorcode, offer } = data;

    socket.to(visitorcode).emit("offer", data);
  }

  @SubscribeMessage('answer')
  handleAnswer(@ConnectedSocket() socket, @MessageBody() data) {
    const { visitorcode, answer } = data;

    socket.to(visitorcode).emit("answer", data);
  }

  @SubscribeMessage('icecandidate')
  handleIcecandidate(@ConnectedSocket() socket, @MessageBody() data) {
    const { visitorcode, icecandidate } = data;

    socket.to(visitorcode).emit("icecandidate", data);
  }
}