'use client'
import { Factory, Sparkles, Loader2, History, ArrowRight, Plus, X } from 'lucide-react'
import { MAX_SUPPLIERS } from '@/hooks/entrepconstant'
import type { ProductionGuidance, SavedProduction, Supplier } from '@/hooks/entrpTypes'

type Props = {
  idea: string
  conceptStatement: string
  suppliers: Supplier[]
  onAddSupplier: () => void
  onRemoveSupplier: (index: number) => void
  onUpdateSupplier: (index: number, patch: Partial<Supplier>) => void
  dailyOutput: string
  onDailyOutputChange: (v: string) => void
  operatingDaysPerWeek: string
  onOperatingDaysPerWeekChange: (v: string) => void
  variants: string
  onVariantsChange: (v: string) => void
  onGenerateProduction: () => void
  isLoading: boolean
  errorMessage: string | null

  savedProductions: SavedProduction[]
  savedProductionsLoading: boolean
  selectedProductionId: string | null
  onSelectSavedProduction: (id: string) => void

  production: ProductionGuidance | null
  onContinue: () => void
}

export function ProductionStage({
  idea,
  conceptStatement,
  suppliers,
  onAddSupplier,
  onRemoveSupplier,
  onUpdateSupplier,
  dailyOutput,
  onDailyOutputChange,
  operatingDaysPerWeek,
  onOperatingDaysPerWeekChange,
  variants,
  onVariantsChange,
  onGenerateProduction,
  isLoading,
  errorMessage,
  savedProductions,
  savedProductionsLoading,
  selectedProductionId,
  onSelectSavedProduction,
  production,
  onContinue,
}: Props) {
  const hasValidSupplier = suppliers.some((s) => s.name.trim())

  return (
    <div className="rounded-xl border bg-white p-6 space-y-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FAEEDA' }}>
          <Factory className="w-4 h-4" style={{ color: '#BA7517' }} />
        </div>
        <div>
          <h2 className="font-semibold text-lg leading-tight">Production Plan</h2>
          <p className="text-xs text-muted-foreground">
            Map out suppliers and delivery flow — AI drafts the process steps.
          </p>
        </div>
      </div>

      {conceptStatement && (
        <div className="rounded-lg px-3.5 py-2.5" style={{ background: 'rgba(11,28,51,0.04)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
            Planning production for
          </p>
          <p className="text-sm font-medium leading-relaxed" style={{ color: '#0B1C33' }}>
            {conceptStatement}
          </p>
        </div>
      )}


      {/* ── Suppliers ── */}
      <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'rgba(0,0,0,0.1)', background: 'rgba(11,28,51,0.02)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suppliers</p>

        <div className="space-y-2">
          {suppliers.map((s, i) => (
            <div key={i} className="rounded-lg border bg-white p-3 space-y-2 relative" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              {suppliers.length > 1 && (
                <button
                  onClick={() => onRemoveSupplier(i)}
                  className="cursor-pointer absolute top-1 right-1  text-muted-foreground hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <div className="grid sm:grid-cols-2 gap-2">
                <input
                  value={s.name}
                  onChange={(e) => onUpdateSupplier(i, { name: e.target.value })}
                  placeholder="Supplier name"
                  className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-400"
                  style={{ borderColor: 'rgba(0,0,0,0.12)' }}
                />
                <input
                  value={s.address}
                  onChange={(e) => onUpdateSupplier(i, { address: e.target.value })}
                  placeholder="Address"
                  className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-400"
                  style={{ borderColor: 'rgba(0,0,0,0.12)' }}
                />
                <input
                  value={s.materials}
                  onChange={(e) => onUpdateSupplier(i, { materials: e.target.value })}
                  placeholder="Materials supplied"
                  className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-400"
                  style={{ borderColor: 'rgba(0,0,0,0.12)' }}
                />
                <input
                  value={s.quantity}
                  onChange={(e) => onUpdateSupplier(i, { quantity: e.target.value })}
                  placeholder="Quantity (e.g. 50 kg/week)"
                  className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-400"
                  style={{ borderColor: 'rgba(0,0,0,0.12)' }}
                />
              </div>
            </div>
          ))}
        </div>

        {suppliers.length < MAX_SUPPLIERS && (
          <button
            onClick={onAddSupplier}
            className="inline-flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: '#BA7517' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add supplier
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Daily output target</label>
          <input
            value={dailyOutput}
            onChange={(e) => onDailyOutputChange(e.target.value)}
            placeholder="e.g. 80-100 orders per day"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30"
            style={{ borderColor: 'rgba(0,0,0,0.12)' }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Operating days per week</label>
          <input
            value={operatingDaysPerWeek}
            onChange={(e) => onOperatingDaysPerWeekChange(e.target.value)}
            placeholder="e.g. 6"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30"
            style={{ borderColor: 'rgba(0,0,0,0.12)' }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Product variants</label>
        <input
          value={variants}
          onChange={(e) => onVariantsChange(e.target.value)}
          placeholder="e.g. Vegetable bundles, protein bundles, mixed family packs"
          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-400 bg-muted/30"
          style={{ borderColor: 'rgba(0,0,0,0.12)' }}
        />
      </div>

      {errorMessage && !production && (
        <div className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: '#FBEAEA', color: '#7A2020' }}>
          {errorMessage}
        </div>
      )}

      <button
        onClick={onGenerateProduction}
        disabled={!idea.trim() || !conceptStatement.trim() || !hasValidSupplier || !dailyOutput.trim() || isLoading}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: '#F5B841', color: '#1A1A1A' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Planning...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Production Plan
          </>
        )}
      </button>

      {!conceptStatement.trim() && (
        <p className="text-xs" style={{ color: '#633806' }}>
          Complete the Business Concept stage first to carry over a concept statement.
        </p>
      )}

      {/* ── Result ── */}
      {production && (
        <div className="pt-4 space-y-5 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          {selectedProductionId && (
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#633806' }}>
              <History className="w-3.5 h-3.5" />
              Viewing a saved plan from your history
            </div>
          )}

        <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Production / delivery process
        </p>
        <ol className="space-y-1.5">
            {production.processSteps
            .map((step) => step.replace(/^\s*\d+(\.\d+)*\.?\s*/, '').trim())
            .filter((step) => step.length > 0)
            .map((step, i) => (
                <li key={i} className="text-sm rounded-lg px-3 py-2 flex gap-2" style={{ background: 'rgba(11,28,51,0.04)' }}>
                <span className="font-semibold shrink-0" style={{ color: '#BA7517' }}>{i + 1}.</span>
                {step}
                </li>
            ))}
        </ol>
        </div>

          <div className="rounded-lg px-3.5 py-3" style={{ background: '#FAEEDA' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#BA7517' }}>
              Feasibility note
            </p>
            <p className="text-sm leading-relaxed">{production.feasibilityNote}</p>
          </div>

          <button
            onClick={onContinue}
            className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-semibold hover:text-[#003887] transition-colors"
            style={{ color: '#0B1C33' }}
          >
            Continue to Financial Plan
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}