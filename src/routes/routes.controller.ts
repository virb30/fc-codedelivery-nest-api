import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoutesGateway } from './routes.gateway';

@Controller('routes')
export class RoutesController {
  // private kafkaProducer: Producer;

  constructor(
    private readonly routesService: RoutesService,
    private routeGateway: RoutesGateway,
  ) {}

  async onModuleInit() {
    // this.kafkaProducer = await this.kafkaClient.connect();
  }

  @Post()
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(createRouteDto);
  }

  @Get()
  findAll() {
    return this.routesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routesService.update(+id, updateRouteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routesService.remove(+id);
  }

  // @Get(':id/start')
  // startRoute(@Param('id') id: string) {
  //   console.log('start', this.kafkaProducer);
  //   this.kafkaProducer.send({
  //     topic: 'route.new-direction',
  //     messages: [
  //       {
  //         key: 'route.new-direction',
  //         value: JSON.stringify({ routeId: id, clientId: '' }),
  //       },
  //     ],
  //   });
  // }

  @MessagePattern('route.new-position')
  async consumeNewPosition(
    @Payload()
    message: {
      value: {
        routeId: string;
        clientId: string;
        position: [number, number];
        finished: boolean;
      };
    },
  ) {
    await this.routeGateway.sendPosition(message.value);
  }
}
