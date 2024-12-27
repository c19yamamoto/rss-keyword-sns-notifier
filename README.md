# RSS Keyword SNS Notifier

RSS フィードに指定したキーワードが含まれる記事が配信されたとき、SNS に通知する仕組み。<br>
`.env` ファイルに RSS フィード、キーワードを記述し、Lambda で定期実行することで実現。<br>
キーワード未指定の場合は、更新された全ての記事を通知。

## Architecture
EventBridge で Lambda 関数を定期実行して RSS フィードを取得し、キーワードが含まれる記事があれば SNS に通知

<div align="center">
<image src="https://github.com/user-attachments/assets/cbe28b8b-7b6c-467f-bf19-aa43c2f71cf0" width="600px">
</image>
</div>

<!--

```mermaid
architecture-beta
    group api[AWS]
    service eventbridge(logos:aws-eventbridge)[EventBridge] in api
    service sns(logos:aws-sns)[Notification] in api
    service lambda(logos:aws-lambda)[Compute] in api
```
-->

## スクリプト

[rss-monitor-check-keyword.ts](./lambda/rss-monitor-check-keyword.ts) : RSS フィードを取得し、キーワードが含まれる記事があれば SNS に通知する Lambda 関数
