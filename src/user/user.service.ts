import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/registerUser.dto';
import { StreamChat } from 'stream-chat';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/loginUser.dto';

@Injectable()
export class UserService {
  private client = StreamChat.getInstance(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_API_SECRET,
  );
  constructor(@InjectRepository(User) private repoUser: Repository<User>) {}

  async register(requestBody: RegisterUserDto) {
    try {
      const existingUser = await this.repoUser.findOne({
        where: { email: requestBody.email },
      });

      if (existingUser && existingUser !== undefined && existingUser !== null) {
        throw new BadRequestException('User already exists.');
      }
      const hashedPassword = await bcrypt.hash(requestBody.password, 10);
      requestBody.password = hashedPassword;

      const savedUser = await this.repoUser.save(requestBody);
      // Create user in Stream Chat
      await this.client.upsertUser({
        id: savedUser.id.toFixed(),
        email: savedUser.email,
        name: savedUser.email,
      });
      const token = this.client.createToken(savedUser.id.toFixed());
      return {
        token,
        user: {
          id: savedUser.id,
          email: savedUser.email,
        },
      };
    } catch (e) {
      throw new BadRequestException('User registration failed.');
    }
  }

  async login(requestBody: LoginUserDto) {
    const user = await this.repoUser.findOne({
      where: { email: requestBody.email },
    });

    const isMatchPassword = await bcrypt.compare(
      requestBody.password,
      user.password,
    );
    if (!user || !isMatchPassword) {
      throw new BadRequestException('Invalid credentials');
    }

    const token = this.client.createToken(user.id.toFixed());

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
