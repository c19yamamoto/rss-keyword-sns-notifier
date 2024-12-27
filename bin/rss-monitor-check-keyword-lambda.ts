#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { RssMonitorLambdaStack } from "../lib/rss-monitor-lambda-stack";

const app = new cdk.App();
new RssMonitorLambdaStack(app, "RssMonitorLambdaStack");
