import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from 'src/room/room.service';

@WebSocketGateway({namespace: 'comment'}) //comment를 받을 클래스
export class CommentGateway {
  constructor(private readonly roomService: RoomService) { }
  
  @WebSocketServer() server: Server;

  @SubscribeMessage('comment')
  handleMessage(socket: Socket, data: any): void {
    //코멘트, 시간, 코멘트 남긴 유저
    const { visitorcode, time, userId, comment } = data;

    //Todo: room DB에 저장
    this.roomService.addCommentToRoom(data);
  }
}

@WebSocketGateway({ namespace: 'room' })
export class RoomGateway {
  constructor(
    private readonly commentGateway: CommentGateway,
    private readonly roomService: RoomService,) { }
  rooms = [];

  @WebSocketServer() server: Server;

  @SubscribeMessage('createRoom')
  handleMessage(@ConnectedSocket() socket, @MessageBody() data) {
    //방을 생성한 사람의 ID
    const { userId } = data;

    //참관코드 생성 및 DB 관련 작업
    const room = this.roomService.createRoom(userId);
    this.rooms.push(room);

    //방장이 방에 입장하도록 한다.
    socket.join(room); 
  }
}