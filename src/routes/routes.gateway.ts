import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Producer } from '@nestjs/microservices/external/kafka.interface';
import { ClientKafka } from '@nestjs/microservices';
import { Inject, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class RoutesGateway implements OnModuleInit {
  private kafkaProducer: Producer;

  @WebSocketServer()
  server: Server;

  constructor(
    @Inject('KAFKA_SERVICE')
    private kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaProducer = await this.kafkaClient.connect();
  }

  @SubscribeMessage('new-direction')
  handleMessage(client: Socket, payload: { routeId: string }) {
    this.kafkaProducer.send({
      topic: 'route.new-direction',
      messages: [
        {
          key: 'route.new-direction',
          value: JSON.stringify({
            routeId: payload.routeId,
            clientId: client.id,
          }),
        },
      ],
    });
    // console.log(payload);
  }

  async sendPosition(data: {
    clientId: string;
    routeId: string;
    position: [number, number];
    finished: boolean;
  }) {
    const { clientId, ...rest } = data;
    const clients = await this.server.sockets.fetchSockets();
    const client = clients.find((client) => client.id === clientId);
    if (!client) {
      console.error(
        'Client not exists, refresh React Application and resent new direction again',
      );
    }
    client.emit('new-position', rest);
  }
}
