import { PieChart, BarChart, LineChart, Table, BigNumber } from './viz'
import type {
  PieFormData, CartesianFormData, TableFormData, BigNumberFormData, QueryData,
} from './viz'

// Sample data: regional sales by month.
const monthlyByRegion: QueryData = {
  data: [
    { month: '2025-01', region: 'NA', sales: 800, orders: 120 },
    { month: '2025-01', region: 'EU', sales: 650, orders:  95 },
    { month: '2025-01', region: 'AS', sales: 720, orders: 110 },
    { month: '2025-02', region: 'NA', sales: 850, orders: 130 },
    { month: '2025-02', region: 'EU', sales: 700, orders: 100 },
    { month: '2025-02', region: 'AS', sales: 900, orders: 140 },
    { month: '2025-03', region: 'NA', sales: 920, orders: 145 },
    { month: '2025-03', region: 'EU', sales: 780, orders: 115 },
    { month: '2025-03', region: 'AS', sales: 1100, orders: 170 },
    { month: '2025-04', region: 'NA', sales: 1100, orders: 165 },
    { month: '2025-04', region: 'EU', sales: 830, orders: 120 },
    { month: '2025-04', region: 'AS', sales: 1500, orders: 210 },
  ],
}

// Aggregated per region (for pie).
const totalByRegion: QueryData = {
  data: [
    { region: 'North America', sales: 3670 },
    { region: 'Europe',        sales: 2960 },
    { region: 'Asia',          sales: 4220 },
    { region: 'South America', sales:  400 },
    { region: 'Africa',        sales:  150 },
    { region: 'Oceania',       sales:   80 },
  ],
}

// Aggregate by month for trendline.
const monthlyTotal: QueryData = {
  data: [
    { month: '2025-01', sales: 2170 },
    { month: '2025-02', sales: 2450 },
    { month: '2025-03', sales: 2800 },
    { month: '2025-04', sales: 3430 },
  ],
}

// Top products for table.
const productsTable: QueryData = {
  data: [
    { sku: 'A-101', product: 'Widget Pro',     units: 1240, revenue: 24800,  margin: 0.42 },
    { sku: 'B-203', product: 'Gadget Max',     units:  820, revenue: 20500,  margin: 0.35 },
    { sku: 'C-044', product: 'Thingamajig 2',  units: 1500, revenue: 18000,  margin: 0.28 },
    { sku: 'D-112', product: 'Whatsit Lite',   units:  640, revenue:  9600,  margin: 0.18 },
    { sku: 'E-089', product: 'Doohickey Pro',  units:  410, revenue:  8200,  margin: 0.31 },
    { sku: 'F-255', product: 'Contraption X',  units:  290, revenue:  7250,  margin: 0.44 },
    { sku: 'G-067', product: 'Gizmo Plus',     units: 1100, revenue:  6600,  margin: 0.22 },
    { sku: 'H-198', product: 'Apparatus 3000', units:  180, revenue:  5400,  margin: 0.38 },
    { sku: 'I-372', product: 'Device Zero',    units:  320, revenue:  4800,  margin: 0.25 },
    { sku: 'J-428', product: 'Bauble Jr',      units:  760, revenue:  3800,  margin: 0.15 },
    { sku: 'K-519', product: 'Doodad Basic',   units:  540, revenue:  2700,  margin: 0.12 },
    { sku: 'L-671', product: 'Widget Mini',    units:  280, revenue:  2240,  margin: 0.20 },
  ],
  colnames: ['sku', 'product', 'units', 'revenue', 'margin'],
}

const section: React.CSSProperties = {
  border: '1px solid #e5e5e5',
  borderRadius: 8,
  padding: 16,
  background: '#fff',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
}

export default function App() {
  const pieForm: PieFormData = {
    vizType: 'pie', groupby: ['region'], metric: 'sales',
    donut: true, innerRadius: 40, outerRadius: 75,
    labelType: 'key_percent', showLabels: true, labelsOutside: true,
    showLegend: true, legendOrientation: 'top',
    numberFormat: 'smart', thresholdForOther: 5, showTotal: true,
  }

  const barForm: CartesianFormData = {
    vizType: 'bar', xAxis: 'month', metrics: ['sales'],
    seriesColumn: 'region',
    stacked: true, showLegend: true, legendOrientation: 'top',
    numberFormat: 'smart', xAxisLabel: 'Month', yAxisLabel: 'Sales',
  }

  const lineForm: CartesianFormData = {
    vizType: 'line', xAxis: 'month', metrics: ['sales'],
    seriesColumn: 'region',
    smooth: true, area: true, showDots: true,
    showLegend: true, legendOrientation: 'top',
    numberFormat: 'smart', xAxisLabel: 'Month', yAxisLabel: 'Sales',
  }

  const tableForm: TableFormData = {
    vizType: 'table',
    columns: ['sku', 'product', 'units', 'revenue', 'margin'],
    columnLabels: { sku: 'SKU', product: 'Product', units: 'Units', revenue: 'Revenue', margin: 'Margin' },
    numericColumns: ['units', 'revenue'],
    pageSize: 6, sortable: true, stripes: true, numberFormat: 'smart',
  }

  const tableMarginForm: TableFormData = {
    ...tableForm,
    numericColumns: ['margin'],
    columns: ['sku', 'product', 'margin'],
    pageSize: 0,
  }

  const bigForm: BigNumberFormData = {
    vizType: 'big-number',
    metric: 'sales',
    subheader: 'Total monthly sales',
    numberFormat: 'smart',
    trendColumn: 'sales',
    compareToPrevious: true,
  }

  return (
    <div style={{
      padding: 24,
      fontFamily: 'system-ui, sans-serif',
      background: '#fafafa',
      minHeight: '100vh',
    }}>
      <h1 style={{ margin: 0 }}>minimal-viz — 5 chart types, zero Superset deps</h1>
      <p style={{ color: '#666', marginTop: 4 }}>
        React + ECharts only. Each chart = ~40-140 lines of vendored logic.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 16,
        marginTop: 16,
      }}>
        <div style={section}>
          <h3 style={{ marginTop: 0 }}>BigNumber + trend</h3>
          <BigNumber formData={bigForm} queriesData={[monthlyTotal]} width={320} height={200} />
        </div>

        <div style={section}>
          <h3 style={{ marginTop: 0 }}>Pie (Donut + Other)</h3>
          <PieChart formData={pieForm} queriesData={[totalByRegion]} width={340} height={280} />
        </div>

        <div style={section}>
          <h3 style={{ marginTop: 0 }}>Bar (stacked by region)</h3>
          <BarChart formData={barForm} queriesData={[monthlyByRegion]} width={340} height={280} />
        </div>

        <div style={section}>
          <h3 style={{ marginTop: 0 }}>Line (smooth + area)</h3>
          <LineChart formData={lineForm} queriesData={[monthlyByRegion]} width={340} height={280} />
        </div>

        <div style={{ ...section, gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Table (sortable, paginated)</h3>
          <Table formData={tableForm} queriesData={[productsTable]} width={800} height={360} />
        </div>

        <div style={{ ...section, gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Table (compact, no pagination, margin as percent)</h3>
          <Table
            formData={{ ...tableMarginForm, numberFormat: 'percent' }}
            queriesData={[productsTable]}
            width={800}
            height={400}
          />
        </div>
      </div>
    </div>
  )
}
