import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';

@Controller('api/v1/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('/register')
  register(@Body() requestBody: RegisterUserDto) {
    return this.userService.register(requestBody);
  }

  @Post('/login')
  login(@Body() requestBody: LoginUserDto) {
    return this.userService.login(requestBody);
  }
}
