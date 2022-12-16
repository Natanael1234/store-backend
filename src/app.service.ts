import { Injectable } from '@nestjs/common';
console.log('Teste 4');

@Injectable()
export class AppService {
  getHello(): string {
    return `Hello World`;
  }
}
