import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable } from 'rxjs';
import { RegisterRequestDto } from 'src/modules/auth/dtos/requests/register.request.dto';
import { EncryptionService } from 'src/modules/system/encryption/services/encryption/encryption.service';
import { Repository } from 'typeorm';
import { CreateUserDTO } from '../../models/dtos/create-user.dto';
import { UpdateUserDTO } from '../../models/dtos/update-user.dto';

import { UserEntity } from '../../models/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private encryptionService: EncryptionService,
  ) {}

  public async register(
    registerRequestDto: RegisterRequestDto,
  ): Promise<boolean> {
    return !!(await this.create(registerRequestDto));
  }

  public async create(userDto: CreateUserDTO): Promise<UserEntity> {
    const user = new UserEntity();
    user.email = userDto.email;
    user.name = userDto.name;
    user.hash = await this.encryptionService.encrypt(userDto.password);
    return this.userRepository.save(user);
  }

  public update(user: UpdateUserDTO): Observable<UserEntity> {
    return from(this.userRepository.save(user));
  }

  public findForId(userId: number): Promise<UserEntity> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  public findForName(userName: string): Promise<UserEntity> {
    return this.userRepository.findOne({ where: { name: userName } });
  }

  public async findForEmail(email: string): Promise<UserEntity> {
    return await this.userRepository.findOne({ where: { email } });
  }

  public findAll(): Observable<UserEntity[]> {
    return from(this.userRepository.find()); // TODO: paginação
  }

  public async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserEntity | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.hash') // add hash/password
      .where({ email })
      .getOne();

    if (user) {
      const decryptedPasword = await this.encryptionService.decrypt(user.hash);
      if (decryptedPasword === password) {
        delete user.hash; // remove hash/password
        return user;
      }
    }
    return null;
  }
}
