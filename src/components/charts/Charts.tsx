import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function getChartTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    isDark,
    gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    tickColor: isDark ? '#989894' : '#6F6E6B',
    tooltipBg: isDark ? '#1A1A1F' : '#171717',
    donutTrack: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  };
}

export function CompletionChart({
  labels,
  values,
  colors,
}: {
  labels: string[];
  values: number[];
  colors: string[];
}) {
  const theme = getChartTheme();

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: 'transparent',
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.85,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeOutQuart' as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.tooltipBg,
        titleFont: { size: 12, weight: 600 as const },
        bodyFont: { size: 12 },
        padding: { x: 12, y: 8 },
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => `${ctx.parsed.x.toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        max: 105,
        border: { display: false },
        grid: { color: theme.gridColor, lineWidth: 1 },
        ticks: {
          color: theme.tickColor,
          font: { size: 11 },
          callback: (v: any) => `${v}%`,
          stepSize: 25,
        },
      },
      y: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          color: theme.tickColor,
          font: { size: 12, weight: 500 as const },
        },
      },
    },
  };

  return (
    <div style={{ height: Math.max(300, labels.length * 50) }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export function ProgressDonut({
  invested,
  total,
  label,
}: {
  invested: number;
  total: number;
  label: string;
}) {
  const theme = getChartTheme();
  const remaining = Math.max(0, total - invested);
  const data = {
    labels: ['Invertido', 'Restante'],
    datasets: [
      {
        data: [invested, remaining],
        backgroundColor: ['#0A8F62', theme.donutTrack],
        borderColor: 'transparent',
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    animation: { duration: 800, easing: 'easeOutQuart' as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.tooltipBg,
        titleFont: { size: 12, weight: 600 as const },
        bodyFont: { size: 12 },
        padding: { x: 12, y: 8 },
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => `${ctx.parsed} minutos`,
        },
      },
    },
  };

  return (
    <div className="relative h-[200px]">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <span className="text-2xl font-bold tracking-tight">{invested}</span>
          <span className="block text-[11px] text-[var(--color-text-muted)] mt-0.5">{label}</span>
        </div>
      </div>
    </div>
  );
}
