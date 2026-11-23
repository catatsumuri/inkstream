## Service health

<Card title="Payment API">
  <Column align="start" gap="2">
    <Row align="center" gap="2">
      <Icon name="circle-check" />
      <Badge color="green">Healthy</Badge>
    </Row>
    <Box padding="2">
      P95 latency: 128 ms · Error rate: 0.08%
    </Box>
  </Column>
</Card>

<Card title="Background jobs">
  <Row align="center" gap="2">
    <Icon name="activity" />
    <Badge color="yellow">Queue elevated</Badge>
  </Row>
  Pending jobs: 1,240
</Card>

These are static, allowlisted components. No generated JavaScript or event
handlers run in the preview.

## Report settings

<Form id="report-settings" action="apply-settings">
  <Input id="query" label="Query" default="payments" />
  <Slider id="threshold" label="Threshold" min="0" max="100" step="5" default="65" />
  <Checkbox id="include-archived" label="Include archived" default="false" />
  <Button type="submit">Apply settings</Button>
</Form>

The preview demonstrates local inputs. Submit emits an event; an application
handler decides what to do. See the application integration demo for event
handling, controlled values, and streaming modes.
