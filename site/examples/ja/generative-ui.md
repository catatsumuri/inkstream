## サービス稼働状況

<Card title="決済 API">
  <Column align="start" gap="2">
    <Row align="center" gap="2">
      <Icon name="circle-check" />
      <Badge color="green">正常</Badge>
    </Row>
    <Box padding="2">
      P95 レイテンシ: 128 ms · エラー率: 0.08%
    </Box>
  </Column>
</Card>

<Card title="バックグラウンドジョブ">
  <Row align="center" gap="2">
    <Icon name="activity" />
    <Badge color="yellow">キュー増加</Badge>
  </Row>
  未処理ジョブ: 1,240 件
</Card>

許可リストにある静的コンポーネントだけを表示します。生成された JavaScript や
イベントハンドラーは実行しません。

## レポート設定

<Form id="report-settings" action="apply-settings">
  <Input id="query" label="検索条件" default="payments" />
  <Slider id="threshold" label="閾値" min="0" max="100" step="5" default="65" />
  <Checkbox id="include-archived" label="過去の記録を含める" default="false" />
  <Button type="submit">設定を適用</Button>
</Form>

このプレビューでは入力を試せます。送信はイベントを通知し、実際の処理はアプリが
決めます。イベント処理・制御値・ストリーミングの動作はアプリ連携デモで確認できます。
