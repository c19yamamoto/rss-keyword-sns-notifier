import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sns from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
export class RssMonitorLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const topic = new sns.Topic(this, "RssMonitorTopic");

    const handler = new lambda.Function(this, "RssMonitorHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "rss_monitor.handler",
      environment: {
        SNS_TOPIC_ARN: topic.topicArn,
      },
    });

    topic.grantPublish(handler);

    // スケジュール設定
    const SCHEDULED_VALUE = process.env.SCHEDULED_VALUE!;
    const SCHEDULED_UNIT = process.env.SCHEDULED_UNIT!;

    const scheduleFunction = scheduleUnits[SCHEDULED_UNIT];

    if (!scheduleFunction) {
      throw new Error(`Unsupported schedule unit: ${SCHEDULED_UNIT}`);
    }
    const schedule = events.Schedule.rate(
      scheduleFunction(parseInt(SCHEDULED_VALUE))
    );

    const rule = new events.Rule(this, "ScheduleRule", {
      schedule,
    });

    rule.addTarget(new targets.LambdaFunction(handler));
  }
}

const scheduleUnits: { [key: string]: (value: number) => cdk.Duration } = {
  minutes: cdk.Duration.minutes,
  hours: cdk.Duration.hours,
  days: cdk.Duration.days,
};
