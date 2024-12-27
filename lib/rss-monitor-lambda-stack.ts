import * as cdk from "aws-cdk-lib";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sns from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import * as dotenv from "dotenv";

dotenv.config();
export class RssMonitorLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 設定値をログに出力
    console.log("RSS_FEED_URL:", process.env.RSS_FEED_URL);
    console.log("KEYWORDS:", process.env.KEYWORDS);
    console.log("SCHEDULED_VALUE:", process.env.SCHEDULED_VALUE);
    console.log("SCHEDULED_UNIT:", process.env.SCHEDULED_UNIT);

    const topic = new sns.Topic(this, "RssMonitorTopic");

    const handler = new lambdaNodejs.NodejsFunction(this, "RssMonitorHandler", {
      entry: "src/lambda/rss-monitor-check-keyword.ts",
      environment: {
        SNS_TOPIC_ARN: topic.topicArn,
        RSS_FEED_URL: process.env.RSS_FEED_URL!,
        SCHEDULED_VALUE: process.env.SCHEDULED_VALUE!,
        SCHEDULED_UNIT: process.env.SCHEDULED_UNIT!,
        // キーワードはオプショナル
        ...(process.env.KEYWORDS && { KEYWORDS: process.env.KEYWORDS }),
      },
    });

    // SNSトピックにパブリッシュする権限を付与
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
