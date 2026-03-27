import { Module, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
// PrismaModule is @Global(), so PrismaService is available everywhere
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: (() => {
        const secret = process.env['JWT_SECRET'];
        if (!secret) {
          const logger = new Logger('AuthModule');
          logger.error('JWT_SECRET environment variable is not set!');
          throw new Error('JWT_SECRET environment variable must be set');
        }
        return secret;
      })(),
      signOptions: {
        expiresIn: `${Number(process.env['ACCESS_TOKEN_TTL_SECONDS'] ?? 900)}s`,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
