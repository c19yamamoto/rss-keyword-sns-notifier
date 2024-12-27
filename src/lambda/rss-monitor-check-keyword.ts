import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import fetch from "node-fetch";
import { DOMParser } from "xmldom";
import dayjs from "dayjs";

const sns = new SNSClient({ region: "ap-northeast-1" });

const RSS_FEED_URL = process.env.RSS_FEED_URL!;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN!;
const KEYWORDS = process.env.KEYWORDS?.split(",");
const SCHEDULED_VALUE = Number(process.env.SCHEDULED_VALUE);
const SCHEDULED_UNIT = process.env.SCHEDULED_UNIT!;

export const handler = async () => {
  try {
    const response = await fetch(RSS_FEED_URL);
    const text = await response.text();
    const parser = new DOMParser();
    const rssDoc = parser.parseFromString(text, "text/xml");
    const items = rssDoc.getElementsByTagName("item");

    // 現在の時間から指定された範囲前の時間を計算
    const timeAgo = new Date(
      Date.now() - calculateTimeRange(SCHEDULED_VALUE, SCHEDULED_UNIT)
    );

    const newItems = filterNewItems(items, timeAgo);
    const message = createMessage(newItems, KEYWORDS);

    if (message) {
      const command = new PublishCommand({
        Message: message,
        TopicArn: SNS_TOPIC_ARN,
      });
      await sns.send(command);
    }
  } catch (error) {
    console.error("Error checking RSS feed:", error);
  }
};

const createMessage = (items: Element[], keywords?: string[]): string => {
  const filteredItems =
    keywords && keywords.length > 0
      ? filterItemsByKeywords(items, keywords)
      : items;
  return filteredItems
    .map((item) => {
      const title = item.getElementsByTagName("title")[0].textContent;
      const link = item.getElementsByTagName("link")[0].textContent;
      return `${title}\n${link}`;
    })
    .join("\n\n");
};

const calculateTimeRange = (value: number, unit: string): number => {
  switch (unit) {
    case "minutes":
      return value * 60 * 1000;
    case "hours":
      return value * 60 * 60 * 1000;
    case "days":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
};

const parsePubDate = (item: Element): Date | null => {
  const dateText =
    item.getElementsByTagName("pubDate")[0]?.textContent ||
    item.getElementsByTagName("dc:date")[0]?.textContent;

  const date = dayjs(dateText, [
    "YYYY-MM-DDTHH:mm:ssZ",
    "YYYY-M-DTHH:mm:ssZ",
  ]).toDate();
  return date;
};

const filterNewItems = (items: HTMLCollectionOf<Element>, timeAgo: Date) =>
  Array.from(items).filter((item) => {
    const pubDate = parsePubDate(item);
    console.log("pubDate:", pubDate);
    return pubDate !== null && pubDate > timeAgo;
  });

const filterItemsByKeywords = (items: Element[], keywords: string[]) =>
  items.filter((item) => {
    const title = item.querySelector("title")?.textContent || "";
    return keywords.some((keyword) => title.includes(keyword));
  });
