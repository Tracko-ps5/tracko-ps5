import React from 'react';
import { Check, X, Sparkles, HardDrive, Cpu, Zap, Disc, Weight } from 'lucide-react';

export const SpecComparison: React.FC = () => {
  return (
    <section id="comparatif" className="my-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 font-mono">
            GUIDE TECHNIQUE 2025-2026
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Tableau Comparatif des Modèles PS5
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md">
          Trouvez la version PlayStation 5 qui correspond exactement à vos besoins et à votre budget.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-black/40">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80">
              <th className="p-4 sm:p-5 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4">
                Caractéristique
              </th>
              <th className="p-4 sm:p-5 text-xs font-black text-cyan-300 uppercase tracking-wider w-1/4 bg-cyan-950/20 border-x border-cyan-500/20">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  PS5 Slim (Standard)
                </div>
                <span className="text-[10px] font-normal text-slate-400 normal-case block mt-0.5">
                  Le choix équilibré pour tous
                </span>
              </th>
              <th className="p-4 sm:p-5 text-xs font-black text-indigo-300 uppercase tracking-wider w-1/4 bg-indigo-950/20 border-r border-indigo-500/20">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  PS5 Pro 2 To
                </div>
                <span className="text-[10px] font-normal text-slate-400 normal-case block mt-0.5">
                  Puissance ultime pour TV 4K/120Hz
                </span>
              </th>
              <th className="p-4 sm:p-5 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4">
                PS5 Classique (V1)
                <span className="text-[10px] font-normal text-slate-500 normal-case block mt-0.5">
                  Modèle initial 2020-2023
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-xs sm:text-sm">
            {/* Meilleur Prix Actuel */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-4 sm:p-5 font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400">💰</span> Meilleur Prix Constaté
              </td>
              <td className="p-4 sm:p-5 font-black text-cyan-400 font-mono text-base bg-cyan-950/10 border-x border-cyan-500/20">
                479,99 € <span className="text-[10px] text-emerald-400 font-semibold block">-70€</span>
              </td>
              <td className="p-4 sm:p-5 font-black text-indigo-400 font-mono text-base bg-indigo-950/10 border-r border-indigo-500/20">
                759,99 € <span className="text-[10px] text-emerald-400 font-semibold block">-40€</span>
              </td>
              <td className="p-4 sm:p-5 font-bold text-slate-300 font-mono text-base">
                459,90 € <span className="text-[10px] text-slate-500 font-normal block">Fin de stock</span>
              </td>
            </tr>

            {/* Puissance Graphique (GPU) */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-4 sm:p-5 font-semibold text-slate-300">
                <Cpu className="w-4 h-4 inline-block mr-2 text-slate-400" />
                Puissance GPU
              </td>
              <td className="p-4 sm:p-5 text-slate-200 bg-cyan-950/10 border-x border-cyan-500/20 font-medium">
                10.3 TFLOPS (RDNA 2)
              </td>
              <td className="p-4 sm:p-5 font-bold text-indigo-300 bg-indigo-950/10 border-r border-indigo-500/20">
                16.7 TFLOPS (+67% CUs)
              </td>
              <td className="p-4 sm:p-5 text-slate-400">
                10.28 TFLOPS
              </td>
            </tr>

            {/* Stockage SSD interne */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-4 sm:p-5 font-semibold text-slate-300">
                <HardDrive className="w-4 h-4 inline-block mr-2 text-slate-400" />
                Stockage SSD
              </td>
              <td className="p-4 sm:p-5 text-slate-200 bg-cyan-950/10 border-x border-cyan-500/20 font-bold">
                1 To SSD NVMe
              </td>
              <td className="p-4 sm:p-5 font-black text-indigo-300 bg-indigo-950/10 border-r border-indigo-500/20">
                2 To SSD NVMe (Double capacité)
              </td>
              <td className="p-4 sm:p-5 text-slate-400">
                825 Go (667 Go utilisables)
              </td>
            </tr>

            {/* Upscaling IA (PSSR) */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-4 sm:p-5 font-semibold text-slate-300">
                <Sparkles className="w-4 h-4 inline-block mr-2 text-slate-400" />
                PlayStation Spectral Resolution (PSSR)
              </td>
              <td className="p-4 sm:p-5 text-slate-400 bg-cyan-950/10 border-x border-cyan-500/20">
                Non (Upscaling classique FSR)
              </td>
              <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-indigo-950/10 border-r border-indigo-500/20 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Inclus (Upscaling IA matériel)
              </td>
              <td className="p-4 sm:p-5 text-slate-500">
                Non
              </td>
            </tr>

            {/* Lecteur de disque Blu-ray */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-4 sm:p-5 font-semibold text-slate-300">
                <Disc className="w-4 h-4 inline-block mr-2 text-slate-400" />
                Lecteur Blu-ray 4K
              </td>
              <td className="p-4 sm:p-5 text-slate-200 bg-cyan-950/10 border-x border-cyan-500/20">
                Inclus & amovible
              </td>
              <td className="p-4 sm:p-5 text-slate-300 bg-indigo-950/10 border-r border-indigo-500/20">
                Optionnel (vendu séparément)
              </td>
              <td className="p-4 sm:p-5 text-slate-300">
                Inclus & fixe
              </td>
            </tr>

            {/* Poids & Encombrement */}
            <tr className="hover:bg-slate-800/30 transition-colors">
              <td className="p-4 sm:p-5 font-semibold text-slate-300">
                <Weight className="w-4 h-4 inline-block mr-2 text-slate-400" />
                Poids & Format
              </td>
              <td className="p-4 sm:p-5 text-slate-200 bg-cyan-950/10 border-x border-cyan-500/20">
                3,2 kg (Châssis compact)
              </td>
              <td className="p-4 sm:p-5 text-slate-200 bg-indigo-950/10 border-r border-indigo-500/20">
                3,1 kg (Format aéré tri-rayures)
              </td>
              <td className="p-4 sm:p-5 text-slate-400">
                4,5 kg (Grand format)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};
