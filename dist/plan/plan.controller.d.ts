import { PlanService } from './plan.service';
export declare class PlanController {
    private readonly planService;
    constructor(planService: PlanService);
    getTodayPlan(): Promise<import("./plan.service").TodayPlan>;
}
