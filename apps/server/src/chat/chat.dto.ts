import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  model!: string;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  text!: string;
}
