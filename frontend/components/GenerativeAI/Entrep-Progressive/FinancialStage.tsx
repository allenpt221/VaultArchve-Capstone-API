'use client'
import { Wallet, Sparkles, Loader2, History, Plus, X, CheckCircle2 } from 'lucide-react'
import { MAX_STARTUP_COST_ITEMS } from '@/hooks/entrepconstant'
import type { FinancialGuidance, SavedFinancial, StartupCostItem } from '@/hooks/entrpTypes'

type Props = {
  idea: string
  conceptStatement: string
  startupCosts: StartupCostItem[]
  onAddStartupCost: () => void
  onRemoveStartupCost: (index: number) => void
  onUpdateStartupCost: (index: number, patch: Partial<StartupCostItem>) => void
  fixedCostsPerMonth: string
  onFixedCostsPerMonthChange: (v: string) => void
  variableCostPerUnit: string
  onVariableCostPerUnitChange: (v: string) => void
  pricePerUnit: string
  onPricePerUnitChange: (v: string) => void
  onGenerateFinancial: () => void
  isLoading: boolean
  errorMessage: string | null

  savedFinancials: SavedFinancial[]
  savedFinancialsLoading: boolean
  selectedFinancialId: string | null
  onSelectSavedFinancial: (id: string) => void

  financial: FinancialGuidance | null
}

export function FinancialStage({
  idea,
  conceptStatement,
  startupCosts,
  onAddStartupCost,
  onRemoveStartupCost,
  onUpdateStartupCost,
  fixedCostsPerMonth,
  onFixedCostsPerMonthChange,
  variableCostPerUnit,
  onVariableCostPerUnitChange,
  pricePerUnit,
  onPricePerUnitChange,
  onGenerateFinancial,
  isLoading,
  errorMessage,
  savedFinancials,
  savedFinancialsLoading,
  selectedFinancialId,
  onSelectSavedFinancial,
  financial,
}: Props) {
  const hasValidCost = startupCosts.some((c) => c.item.trim())

  return (
    <div className="rounded-xl border bg-white p-6 space-y-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FAEEDA' }}>
          <Wallet className="w-4 h-4" style={{ color: '#BA7517' }} />
        </div>
        <div>
          <h2 className="font-semibold text-lg leading-tight">Financial Plan</h2>
          <p className="text-xs text-muted-foreground">
            Enter your real costs and pricing — AI checks viability and break-even.
          </p>
        </div>
      </div>

      {conceptStatement && (
        <div className="rounded-lg px-3.5 py-2.5" style={{ background: 'rgba(11,28,51,0.04)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
            Evaluating finances for
          </p>
          <p className="text-sm font-medium leading-relaxed" style={{ color: '#0B1C33' }}>
            {conceptStatement}
          </p>
        </div>
      )}


      {/* ── Startup costs ── */}
      <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'rgba(0,0,0,0.1)', background: 'rgba(11,28,51,0.02)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Startup costs</p>

        <div className="space-y-2">
          {startupCosts.map((c, i) => (
            <div key={i} className="rounded-lg border bg-white p-3 space-y-2 relative" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              {startupCosts.length > 1 && (
                <button
                  onClick={() => onRemoveStartupCost(i)}
                  className="cursor-pointer absolute top-1 right-1 text-muted-foreground hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <div className="grid sm:grid-cols-3 gap-2">
                <input
                  value={c.item}
                  onChange={(e) => onUpdateStartupCost(i, { item: e.target.value })}
                  placeholder="Item (e.g. App development)"
                  className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-400"
                  style={{ borderColor: 'rgba(0,0,0,0.12)' }}
                />
                <input
                  value={c.category}
                  onChange={(e) => onUpdateStartupCost(i, { category: e.target.value })}
                  placeholder="Category (e.g. Technology)"
                  className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-400"
                  style={{ borderColor: 'rgba(0,0,0,0.12)' }}
                />
                <input
                  value={c.cost}
                  onChange={(e) => onUpdateStartupCost(i, { cost: e.target.value })}
                  placeholder="Cost"
                  className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-400"
                  style={{ borderColor: 'rgba(0,0,0,0.12)' }}
                />
              </div>
            </div>
          ))}
        </div>

        {startupCosts.length < MAX_STARTUP_COST_ITEMS && (
          <button
            onClick={onAddStartupCost}
            className="inline-flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: '#BA7517' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add cost item
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Fixed costs / month</label>
          <input
            value={fixedCostsPerMonth}
            onChange={(e) => onFixedCostsPerMonthChange(e.target.value)}
            placeholder="e.g. 20000"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30"
            style={{ borderColor: 'rgba(0,0,0,0.12)' }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Variable cost / unit</label>
          <input
            value={variableCostPerUnit}
            onChange={(e) => onVariableCostPerUnitChange(e.target.value)}
            placeholder="e.g. 120"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30"
            style={{ borderColor: 'rgba(0,0,0,0.12)' }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Price / unit</label>
          <input
            value={pricePerUnit}
            onChange={(e) => onPricePerUnitChange(e.target.value)}
            placeholder="e.g. 180"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30"
            style={{ borderColor: 'rgba(0,0,0,0.12)' }}
          />
        </div>
      </div>

      {errorMessage && !financial && (
        <div className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: '#FBEAEA', color: '#7A2020' }}>
          {errorMessage}
        </div>
      )}

      <button
        onClick={onGenerateFinancial}
        disabled={
          !idea.trim() ||
          !conceptStatement.trim() ||
          !hasValidCost ||
          !fixedCostsPerMonth.trim() ||
          !variableCostPerUnit.trim() ||
          !pricePerUnit.trim() ||
          isLoading
        }
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: '#F5B841', color: '#1A1A1A' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Evaluating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Financial Plan
          </>
        )}
      </button>

      {!conceptStatement.trim() && (
        <p className="text-xs" style={{ color: '#633806' }}>
          Complete the Business Concept stage first to carry over a concept statement.
        </p>
      )}

      {/* ── Result ── */}
      {financial && (
        <div className="pt-4 space-y-5 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {selectedFinancialId && (
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#633806' }}>
              <History className="w-3.5 h-3.5" />
              Viewing a saved plan from your history
            </div>
          )}

          <div className="rounded-lg px-3.5 py-3" style={{ background: '#FAEEDA' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#BA7517' }}>
              Pricing strategy
            </p>
            <p className="text-sm leading-relaxed">{financial.pricingStrategy}</p>
          </div>

          <div className="rounded-lg px-3.5 py-3" style={{ background: 'rgba(11,28,51,0.04)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">
              Viability summary
            </p>
            <p className="text-sm leading-relaxed">{financial.viabilitySummary}</p>
          </div>

          <div className="rounded-lg px-3.5 py-3 flex gap-2" style={{ background: '#EAF3DE' }}>
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#3B6D11' }} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#27500A' }}>
                Break-even estimate
              </p>
              <p className="text-sm leading-relaxed">{financial.breakEvenNote}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}