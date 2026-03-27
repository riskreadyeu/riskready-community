import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import type { AuthenticatedRequest } from '../shared/types';
import { CreateConversationDto, SendMessageDto } from './chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('models')
  getModels() {
    return this.chatService.listModels();
  }

  @Get('conversations')
  getConversations(@Req() req: AuthenticatedRequest) {
    return this.chatService.listConversations(req.user);
  }

  @Post('conversations')
  createConversation(@Req() req: AuthenticatedRequest, @Body() body: CreateConversationDto) {
    return this.chatService.createConversation(req.user, body);
  }

  @Get('conversations/:id')
  getConversation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.chatService.getConversation(req.user, id);
  }

  @Get('conversations/:id/messages')
  getMessages(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.chatService.listMessages(req.user, id);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: SendMessageDto,
  ) {
    return this.chatService.sendMessage(req.user, id, body);
  }

  @Get('runs/:runId/stream')
  async streamRun(
    @Req() req: AuthenticatedRequest,
    @Param('runId') runId: string,
    @Res() res: Response,
  ) {
    await this.chatService.proxyRunStream(req.user, runId, res);
  }
}
