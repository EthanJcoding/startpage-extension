import { Controller, Get } from '@nestjs/common';
import { GithubService } from './github.service';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('prs')
  getPullRequests() {
    return this.githubService.getPullRequests();
  }

  @Get('my-prs')
  getMyPullRequests() {
    return this.githubService.getMyPullRequests();
  }
}
