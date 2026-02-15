import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ScopeItemService } from '../services/scope-item.service';
import { CreateScopeItemDto, UpdateScopeItemDto } from '../dto/scope-item.dto';
import { ScopeType } from '@prisma/client';

@Controller('scope-items')
@UseGuards(JwtAuthGuard)
export class ScopeItemController {
  constructor(private readonly scopeItemService: ScopeItemService) {}

  @Get()
  async findAll(
    @Query('orgId') orgId: string,
    @Query('scopeType') scopeType?: ScopeType
  ) {
    return this.scopeItemService.findAll(orgId, scopeType);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.scopeItemService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateScopeItemDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.scopeItemService.create(dto, userId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateScopeItemDto) {
    return this.scopeItemService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.scopeItemService.delete(id);
  }
}
