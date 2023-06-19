import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from './modules/system/pipes/custom-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const documentConfig = new DocumentBuilder()
    .setTitle('Store backend')
    .setDescription('Backend for store')
    .setVersion('1.0')
    .addTag('store')
    .build();
  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('api', app, document);

  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  ); // TODO: como usar isso nos testes?
  await app.listen(3000);
}
bootstrap();
