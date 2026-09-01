import React, { useState } from 'react';
import { EditionDetails, PricePoint } from '../types';
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
import { TrendingDown, Calendar, Award, BarChart3, HelpCircle, Layers, ShieldCheck, Sparkles } from 'lucide-react';

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

  const historyData = edition.priceHistory[period] || edition.priceHistory['30d'];

  const chartData: ChartDataPoint[] = historyData.map((d) => ({
    date: d.date,
    price: d.price,
    merchant: d.merchant,
    msrp: edition.msrp,
    average: edition.averagePrice
  }));

  const allPrices = chartData.map((d) => d.price);
  const minDataPrice = Math.min(...allPrices, edition.lowestEverPrice);
  const maxDataPrice = Math.max(...allPrices, edition.highestPrice, edition.msrp);
  
  // Marges Y pour un affichage aéré
  const yDomainMin = Math.floor((minDataPrice - 20) / 10) * 10;
  const yDomainMax = Math.ceil((maxDataPrice + 15) / 10) * 10;

  const periodsConfig: { key: Period; label: string }[] = [
    { key: '7d', label: '7 Jours' },
    { key: '30d', label: '30 Jours' },
    { key: '3m', label: '3 Mois' },
    { key: '6m', label: '6 Mois' },
    { key: '1y', label: '1 An' },
  ];

  // Tooltip personnalisé interactif
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ChartDataPoint = payload[0].payload;
      const discount = edition.msrp > data.price ? edition.msrp - data.price : 0;
      const discountPercent = edition.msrp > 0 ? Math.round((discount / edition.msrp) * 100) : 0;

      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 sm:p-3.5 rounded-xl shadow-xl border border-slate-700/80 text-xs min-w-[170px] space-y-1.5 z-30 pointer-events-none">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <span className="text-slate-400 font-medium">{data.date}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-300 font-semibold">
              {data.merchant}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3 pt-0.5">
            <span className="text-slate-300">Prix constaté :</span>
            <span className="text-sm font-black text-white">{data.price.toFixed(2)} €</span>
          </div>

          {discount > 0 ? (
            <div className="flex items-center justify-between gap-2 text-[11px] text-emerald-400 font-medium pt-1 border-t border-slate-800/80">
              <span>Économie vs Sony :</span>
              <span>-{discount.toFixed(0)} € (-{discountPercent}%)</span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 pt-0.5">
              Conforme au prix de vente officiel
            </div>
          )}
        </div>
      );
    };
    return null;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl md:rounded-3xl p-5 sm:p-7 shadow-xs">
      {/* En-tête de la section Historique */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Historique et évolution du prix
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
              Temps Réel
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analyse des variations tarifaires et suivi des baisses de prix constatées
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
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pastilles Métriques Clés */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-6">
        {/* Prix Actuel */}
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Prix actuel le plus bas
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {edition.currentLowestPrice.toFixed(2)} €
          </div>
          <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <TrendingDown className="w-3.5 h-3.5 shrink-0" />
            <span>Chez {edition.currentLowestMerchant}</span>
          </div>
        </div>

        {/* Prix Moyen Constaté */}
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Prix moyen du marché
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {edition.averagePrice.toFixed(2)} €
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Prix officiel Sony : {edition.msrp.toFixed(2)} €
          </div>
        </div>

        {/* Plus Bas Historique */}
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 transition-all">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Plus bas historique enregistré
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
            {edition.lowestEverPrice.toFixed(2)} €
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Constaté en {edition.lowestEverDate}</span>
          </div>
        </div>
      </div>

      {/* Options d'affichage du graphique */}
      <div className="flex items-center justify-between gap-4 mb-3 px-1 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span className="font-medium text-slate-700">Prix constaté</span>
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
          Survolez un point pour voir le marchand
        </div>
      </div>

      {/* Graphique Recharts Interactif & Responsive */}
      <div className="w-full h-64 sm:h-72 select-none">
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

            {/* Ligne de référence : Prix catalogue officiel Sony */}
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

            {/* Courbe et remplissage de la zone */}
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
                className: 'drop-shadow-md'
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

      {/* Note d'analyse contextuelle */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-semibold text-slate-800">Indice TRACKO :</span>{' '}
          {edition.statusReason}. Les relevés incluent l'historique moyen constaté auprès des marchands officiels français (Fnac, Amazon, Cdiscount, Boulanger, Back Market).
        </p>
      </div>
    </div>
  );
};
