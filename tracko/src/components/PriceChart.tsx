import React, { useState } from 'react';
import { EditionDetails } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { TrendingDown, Calendar, BarChart3, HelpCircle, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface PriceChartProps {
  edition: EditionDetails;
}

type Period = '7d' | '30d' | '3m' | '6m' | '1y';

interface ChartDataPoint {
  date: string;
  price: number;
  merchant: string;
  msrp: number;
  average: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({ edition }) => {
  const [period, setPeriod] = useState<Period>('30d');
  const [showMsrpLine, setShowMsrpLine] = useState(true);

  // Extraire uniquement les données réelles de la période sélectionnée
  const currentPeriodData = edition.priceHistory && edition.priceHistory[period]
    ? edition.priceHistory[period]
    : [];

  // Relevés réels totaux connus
  const allKnownData = edition.priceHistory
    ? (edition.priceHistory['1y']?.length ? edition.priceHistory['1y'] :
       edition.priceHistory['6m']?.length ? edition.priceHistory['6m'] :
       edition.priceHistory['3m']?.length ? edition.priceHistory['3m'] :
       edition.priceHistory['30d']?.length ? edition.priceHistory['30d'] :
       edition.priceHistory['7d'] || [])
    : [];

  const periodsConfig: { key: Period; label: string }[] = [
    { key: '7d', label: '7 jours' },
    { key: '30d', label: '30 jours' },
    { key: '3m', label: '3 mois' },
    { key: '6m', label: '6 mois' },
    { key: '1y', label: '1 an' },
  ];

  const totalPointsCount = currentPeriodData.length;
  const hasMultiplePointsInPeriod = totalPointsCount >= 2;
  const hasSinglePointInPeriod = totalPointsCount === 1;
  const hasAnyDataAtAll = allKnownData.length > 0;

  const chartData: ChartDataPoint[] = hasMultiplePointsInPeriod
    ? currentPeriodData.map((d) => ({
        date: d.date,
        price: d.price,
        merchant: d.merchant,
        msrp: edition.msrp,
        average: edition.averagePrice,
      }))
    : [];

  const allPrices = chartData.map((d) => d.price);
  const minDataPrice = allPrices.length > 0
    ? Math.min(...allPrices)
    : (edition.currentLowestPrice > 0 ? edition.currentLowestPrice : 400);
  const maxDataPrice = allPrices.length > 0
    ? Math.max(...allPrices, edition.msrp || 0)
    : (edition.msrp || 500);
  
  const yDomainMin = Math.floor((minDataPrice - 20) / 10) * 10;
  const yDomainMax = Math.ceil((maxDataPrice + 15) / 10) * 10;

  // Tooltip interactif avec date et marchand
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ChartDataPoint = payload[0].payload;
      const discount = edition.msrp > data.price ? edition.msrp - data.price : 0;
      const discountPercent = edition.msrp > 0 ? Math.round((discount / edition.msrp) * 100) : 0;

      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-xl shadow-xl border border-slate-700/80 text-xs min-w-[170px] space-y-1 z-30 pointer-events-none">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <span className="text-slate-400 font-medium">{data.date}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-300 font-bold">
              {data.merchant}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3 pt-0.5">
            <span className="text-slate-300">Prix constaté :</span>
            <span className="text-sm font-black text-white">{data.price.toFixed(2)} €</span>
          </div>

          {discount > 0 ? (
            <div className="flex items-center justify-between gap-2 text-[11px] text-emerald-400 font-semibold pt-1 border-t border-slate-800/80">
              <span>Économie vs Sony :</span>
              <span>-{discount.toFixed(0)} € (-{discountPercent}%)</span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 pt-0.5">
              Conforme au prix officiel Sony
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-[clamp(1rem,2vw,1.5rem)] p-[clamp(1rem,2.2vw,1.75rem)] shadow-xs w-full">
      {/* En-tête de l'historique */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Évolution du prix
            </h3>

            {/* Badge Dynamique strict */}
            {hasMultiplePointsInPeriod ? (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80">
                {totalPointsCount} relevés réels
              </span>
            ) : hasSinglePointInPeriod ? (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200/80">
                1 relevé réel
              </span>
            ) : (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200/80">
                Historique en cours de constitution
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Historique basé exclusivement sur les prix réellement enregistrés
          </p>
        </div>

        {/* Sélecteur de période */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
          {periodsConfig.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                period === p.key
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* CAS 1 : Plusieurs observations dans la période -> Courbe réelle */}
      {hasMultiplePointsInPeriod ? (
        <div className="mt-5 space-y-4">
          {/* Légende du graphique */}
          <div className="flex items-center justify-between gap-4 px-1 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <span className="font-semibold text-slate-700">Relevés réels</span>
              </span>
              <button
                onClick={() => setShowMsrpLine(!showMsrpLine)}
                className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <span className={`w-3 h-0.5 border-t-2 border-dashed ${showMsrpLine ? 'border-slate-400' : 'border-slate-300'}`} />
                <span className={showMsrpLine ? 'font-semibold text-slate-700' : 'text-slate-400'}>
                  Prix officiel Sony ({edition.msrp.toFixed(0)} €)
                </span>
              </button>
            </div>
            <div className="hidden sm:block text-[11px] text-slate-400">
              {totalPointsCount} points enregistrés
            </div>
          </div>

          <div className="w-full h-[clamp(210px,28vw,280px)] select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="trackoPriceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  dy={8}
                />

                <YAxis
                  domain={[yDomainMin, yDomainMax]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(v) => `${v}€`}
                  dx={-5}
                />

                <Tooltip content={<CustomTooltip />} />

                {showMsrpLine && (
                  <ReferenceLine
                    y={edition.msrp}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `MSRP ${edition.msrp.toFixed(0)}€`,
                      position: 'insideTopRight',
                      fill: '#94a3b8',
                      fontSize: 10,
                      fontWeight: 600,
                      offset: 5
                    }}
                  />
                )}

                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#trackoPriceGradient)"
                  activeDot={{
                    r: 6,
                    fill: '#1d4ed8',
                    stroke: '#ffffff',
                    strokeWidth: 3,
                  }}
                  dot={{
                    r: 4,
                    fill: '#ffffff',
                    stroke: '#2563eb',
                    strokeWidth: 2
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : hasSinglePointInPeriod ? (
        /* CAS 2 : 1 seule observation dans la période -> Point propre sans fausse ligne */
        <div className="mt-5 w-full bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-slate-900">
            Premier relevé enregistré
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md">
            Un premier prix de <span className="font-extrabold text-slate-900">{currentPeriodData[0].price.toFixed(2)} €</span> chez <span className="font-bold text-slate-900">{currentPeriodData[0].merchant}</span> ({currentPeriodData[0].date}) a été enregistré.
          </p>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            La courbe se tracera automatiquement dès l'enregistrement du 2ème relevé.
          </p>
        </div>
      ) : hasAnyDataAtAll ? (
        /* CAS 3 : Données existantes mais pas sur cette période */
        <div className="mt-5 w-full h-44 flex flex-col items-center justify-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-7 h-7 text-slate-400 mb-2" />
          <p className="text-sm font-bold text-slate-700">
            Pas encore de relevé sur cette période ({periodsConfig.find(p => p.key === period)?.label})
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Des relevés sont enregistrés sur d'autres périodes. Cliquez sur 30 jours, 3 mois ou 1 an.
          </p>
        </div>
      ) : (
        /* CAS 4 : 0 observation -> État d'attente propre */
        <div className="mt-5 w-full h-44 flex flex-col items-center justify-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
            <BarChart3 className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Historique en cours de constitution
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            TRACKO commence à enregistrer les prix à partir de vos premiers relevés.
          </p>
        </div>
      )}
    </div>
  );
};
