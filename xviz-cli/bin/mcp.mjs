// MCP server entry point. Exposes chart rendering as MCP tools so LLMs
// (Claude, etc.) can generate charts via the Model Context Protocol.
// Communicates over stdio, per MCP convention.

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { Engine, normalizeData } from './renderer.mjs'

const CHART_TYPES = ['pie', 'bar', 'line', 'table', 'big-number', 'scatter', 'heatmap', 'sankey', 'funnel', 'gauge']

// Tool schemas. We expose one general-purpose tool + convenience tools per chart.
// Keep schemas focused enough for an LLM to fill in correctly from natural language.
const tools = [
  {
    name: 'render_chart',
    description:
      'Render a chart to a PNG image from tabular data. Supports ' + CHART_TYPES.join(', ') +
      '. Returns base64-encoded PNG. Use this when the user asks to visualize data.',
    inputSchema: {
      type: 'object',
      required: ['type', 'data', 'formData'],
      properties: {
        type: {
          type: 'string', enum: CHART_TYPES,
          description: 'Chart type.',
        },
        data: {
          type: 'array',
          description: 'Array of row objects (e.g. [{region: "NA", sales: 100}, ...]).',
          items: { type: 'object' },
        },
        formData: {
          type: 'object',
          description:
            'Chart-specific configuration. Key fields by type: ' +
            'pie={groupby:[...], metric, donut?, innerRadius?, outerRadius?, labelType?}; ' +
            'bar/line={xAxis, metrics:[...], seriesColumn?, stacked?, smooth?, area?}; ' +
            'table={columns?:[...], numericColumns?:[...], pageSize?}; ' +
            'big-number={metric, subheader?, trendColumn?, compareToPrevious?}; ' +
            'scatter={xAxis, yAxis, seriesColumn?, sizeColumn?}; ' +
            'heatmap={xAxis, yAxis, metric}; ' +
            'sankey={source, target, metric}; ' +
            'funnel={groupby:[...], metric}; ' +
            'gauge={metric, min?, max?, thresholds?:[{at,color}]}.',
        },
        width: { type: 'number', default: 800, description: 'Image width in px.' },
        height: { type: 'number', default: 500, description: 'Image height in px.' },
      },
    },
  },
  {
    name: 'list_chart_types',
    description: 'List the supported chart types.',
    inputSchema: { type: 'object', properties: {} },
  },
]

async function main() {
  const engine = new Engine()
  await engine.launch()

  const server = new Server(
    { name: 'xviz', version: '0.1.0' },
    { capabilities: { tools: {} } },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }))

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params

    if (name === 'list_chart_types') {
      return { content: [{ type: 'text', text: `Supported chart types: ${CHART_TYPES.join(', ')}` }] }
    }

    if (name === 'render_chart') {
      const { type, data, formData, width = 800, height = 500 } = args
      if (!type || !data || !formData) {
        return { isError: true, content: [{ type: 'text', text: 'Missing required args: type, data, formData' }] }
      }
      if (!CHART_TYPES.includes(type)) {
        return { isError: true, content: [{ type: 'text', text: `Unknown chart type "${type}". Supported: ${CHART_TYPES.join(', ')}` }] }
      }
      try {
        // Ensure vizType is set on formData (some charts require it internally).
        const effectiveFormData = { ...formData, vizType: formData.vizType ?? type }
        const { buffer } = await engine.render({
          type,
          width: Number(width), height: Number(height),
          formData: effectiveFormData,
          queriesData: normalizeData(data),
          format: 'png',
        })
        return {
          content: [
            {
              type: 'image',
              data: buffer.toString('base64'),
              mimeType: 'image/png',
            },
            {
              type: 'text',
              text: `Rendered ${type} chart (${width}×${height}, ${buffer.length} bytes PNG).`,
            },
          ],
        }
      } catch (e) {
        return { isError: true, content: [{ type: 'text', text: `Render failed: ${e.message}` }] }
      }
    }

    return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${name}` }] }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)

  // Graceful shutdown on stdin close.
  process.on('SIGINT', async () => { await engine.dispose(); process.exit(0) })
  process.on('SIGTERM', async () => { await engine.dispose(); process.exit(0) })
}

main().catch((err) => {
  console.error('MCP server fatal:', err)
  process.exit(1)
})
