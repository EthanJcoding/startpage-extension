"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const todo_module_1 = require("./todo/todo.module");
const jira_module_1 = require("./jira/jira.module");
const github_module_1 = require("./github/github.module");
const weather_module_1 = require("./weather/weather.module");
const lunch_module_1 = require("./lunch/lunch.module");
const plan_module_1 = require("./plan/plan.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            todo_module_1.TodoModule,
            jira_module_1.JiraModule,
            github_module_1.GithubModule,
            weather_module_1.WeatherModule,
            lunch_module_1.LunchModule,
            plan_module_1.PlanModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map