import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ChangeTemplateService } from '../services/change-template.service';
import {
  CreateChangeFromTemplateDto,
  CreateChangeTemplateDto,
  ToggleChangeTemplateDto,
  UpdateChangeTemplateDto,
} from '../dto/change-template.dto';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('itsm/change-templates')
export class ChangeTemplateController {
  constructor(private readonly service: ChangeTemplateService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('isActive') isActive?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      category,
      search,
    });
  }

  @Get('generate-code/:category')
  async generateCode(@Param('category') category: string) {
    const code = await this.service.generateTemplateCode(category);
    return { templateCode: code };
  }

  @Get('by-code/:code')
  async findByCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateChangeTemplateDto, @Req() req: AuthenticatedRequest) {
    const templateCode = await this.service.generateTemplateCode(data.category);
    return this.service.create({ ...data, templateCode } as CreateChangeTemplateDto & { templateCode: string }, req.user?.id);
  }

  @Post(':id/create-change')
  async createChangeFromTemplate(
    @Param('id') id: string,
    @Body() data: CreateChangeFromTemplateDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.createChangeFromTemplate(id, {
      ...data,
      plannedStart: data.plannedStart ? new Date(data.plannedStart) : undefined,
      plannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : undefined,
      requesterId: req.user.id,
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateChangeTemplateDto) {
    return this.service.update(id, data);
  }

  @Put(':id/toggle-active')
  async toggleActive(@Param('id') id: string, @Body() data: ToggleChangeTemplateDto) {
    return this.service.toggleActive(id, data.isActive);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
