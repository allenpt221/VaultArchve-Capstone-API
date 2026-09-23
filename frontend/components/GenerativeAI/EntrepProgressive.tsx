'use client'
import { ENTREP_STAGES } from '@/hooks/entrepconstant'
import { useEntrepProgressiveTrial } from '@/hooks/useEntrepProgressiveTrail'
import { Check, Lock } from 'lucide-react'
import { ConceptStage } from './Entrep-Progressive/ConceptStage'
import { SWOTStage } from './Entrep-Progressive/SWOTStage'
import { MarketResearchStage } from './Entrep-Progressive/MarketResearchStage'
import { ProductionStage } from './Entrep-Progressive/ProductionStage'
import { FinancialStage } from './Entrep-Progressive/FinancialStage'

function EntrepProgressive() {
  const t = useEntrepProgressiveTrial()
  const activeLabel = ENTREP_STAGES.find((s) => s.key === t.activeStage)?.label ?? ''
  const previousLabel = ENTREP_STAGES[t.activeIndex - 1]?.label
  const stageLocked = t.isStageLocked(t.activeStage)

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* ── Progress bar ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Step {t.activeIndex + 1} of {ENTREP_STAGES.length}</span>
          <span>{t.percentComplete}% complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${t.percentComplete}%`, background: 'linear-gradient(90deg, #BA7517, #E5A93A)' }}
          />
        </div>
      </div>

      {/* ── Stage tabs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {ENTREP_STAGES.map((stage, i) => {
          const Icon = stage.icon
          const isActive = stage.key === t.activeStage
          const isDone = t.completedStages.has(stage.key)
          const isLocked = !isActive && !isDone && t.isStageLocked(stage.key)

          return (
            <button
              key={stage.key}
              onClick={() => !isLocked && t.setActiveStage(stage.key)}
              disabled={isLocked}
              aria-disabled={isLocked}
              title={isLocked ? `Complete ${ENTREP_STAGES[i - 1]?.label} first` : undefined}
              className="relative flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 border transition-colors text-center disabled:cursor-not-allowed"
              style={{
                background: isActive ? '#0B1C33' : '#FFFFFF',
                borderColor: isActive ? '#0B1C33' : 'rgba(0,0,0,0.08)',
                cursor: isLocked ? 'not-allowed' : 'pointer',
              }}
            >
              <span
                className="absolute top-1.5 left-2 text-[10px] leading-none"
                style={{ color: isActive ? '#FFFFFF' : isLocked ? '#C7C6C1' : '#000000' }}
              >
                Step {i + 1}
              </span>

              <span className="relative">
                <Icon className="w-4 h-4" style={{ color: isActive ? '#FFFFFF' : isLocked ? '#B0AFAA' : '#444441' }} />
                {isDone && (
                  <span
                    className="absolute -top-1.5 -right-2 w-3 h-3 rounded-full flex items-center justify-center"
                    style={{ background: '#3B6D11' }}
                  >
                    <Check className="w-2 h-2 text-white" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="text-xs font-medium leading-tight" style={{ color: isActive ? '#FFFFFF' : isLocked ? '#B0AFAA' : '#1A1A1A' }}>
                {stage.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Stage content ── */}
      {stageLocked ? (
        <div className="rounded-xl border bg-white p-10 text-center space-y-2" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          <Lock className="w-5 h-5 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">{activeLabel} is locked.</p>
          <p className="text-xs text-muted-foreground">Complete {previousLabel} first to unlock this stage.</p>
        </div>
      ) : t.activeStage === 'concept' ? (
        <ConceptStage
          idea={t.idea}
          onIdeaChange={t.setIdea}
          context={t.context}
          onContextChange={t.setContext}
          onGenerateConcept={t.handleGenerateConcept}
          isLoading={t.isConceptLoading}
          errorMessage={t.conceptError}
          limitedUntil={t.conceptLimitedUntil}
          countdown={t.conceptCountdown}
          savedConcepts={t.conceptHistory}
          savedConceptsLoading={t.conceptHistoryLoading}
          selectedConceptId={t.selectedConceptId}
          onSelectSavedConcept={t.handleSelectSavedConcept}
          onDeleteSavedConcept={t.handleDeleteSavedConcept}
          guidance={t.displayedConcept}
          selectedConceptStatement={t.selectedConceptStatement}
          onSelectedConceptStatementChange={t.setSelectedConceptStatement}
          selectedName={t.selectedName}
          onSelectedNameChange={t.setSelectedName}
          selectedTagline={t.selectedTagline}
          onSelectedTaglineChange={t.setSelectedTagline}
          selectedRationale={t.selectedRationale}
          onSelectedRationaleChange={t.setSelectedRationale}
          onContinue={() => t.setActiveStage('swot')}
        />
      ) : t.activeStage === 'swot' ? (
        <SWOTStage
          idea={t.idea}
          conceptStatement={t.selectedConceptStatement}
          notes={t.swotNotes}
          onNotesChange={t.setSwotNotes}
          onGenerateSWOT={t.handleGenerateSWOT}
          isLoading={t.isSwotLoading}
          errorMessage={t.swotError}
          limitedUntil={t.swotLimitedUntil}
          countdown={t.swotCountdown}
          savedSWOTs={t.swotHistory}
          savedSWOTsLoading={t.swotHistoryLoading}
          selectedSwotId={t.selectedSwotId}
          onSelectSavedSWOT={t.handleSelectSavedSWOT}
          swot={t.displayedSWOT}
          onContinue={() => t.setActiveStage('market')}
        />
      ) : t.activeStage === 'market' ? (
        <MarketResearchStage
          idea={t.idea}
          conceptStatement={t.selectedConceptStatement}
          notes={t.marketNotes}
          onNotesChange={t.setMarketNotes}
          surveyResultsInterpretation={t.surveyResultsInterpretation}
          onSurveyResultsInterpretationChange={t.setSurveyResultsInterpretation}
          onGenerateMarketResearch={t.handleGenerateMarketResearch}
          isLoading={t.isMarketLoading}
          errorMessage={t.marketError}
          limitedUntil={t.marketLimitedUntil}
          countdown={t.marketCountdown}
          savedMarketResearches={t.marketHistory}
          savedMarketResearchesLoading={t.marketHistoryLoading}
          selectedMarketId={t.selectedMarketId}
          onSelectSavedMarketResearch={t.handleSelectSavedMarketResearch}
          marketResearch={t.displayedMarketResearch}
          onContinue={() => t.setActiveStage('production')}
        />
      ) : t.activeStage === 'production' ? (
        <ProductionStage
          idea={t.idea}
          conceptStatement={t.selectedConceptStatement}
          suppliers={t.suppliers}
          onAddSupplier={t.handleAddSupplier}
          onRemoveSupplier={t.handleRemoveSupplier}
          onUpdateSupplier={t.handleUpdateSupplier}
          dailyOutput={t.dailyOutput}
          onDailyOutputChange={t.setDailyOutput}
          operatingDaysPerWeek={t.operatingDaysPerWeek}
          onOperatingDaysPerWeekChange={t.setOperatingDaysPerWeek}
          variants={t.variants}
          onVariantsChange={t.setVariants}
          onGenerateProduction={t.handleGenerateProduction}
          isLoading={t.isProductionLoading}
          errorMessage={t.productionError}
          limitedUntil={t.productionLimitedUntil}
          countdown={t.productionCountdown}
          savedProductions={t.productionHistory}
          savedProductionsLoading={t.productionHistoryLoading}
          selectedProductionId={t.selectedProductionId}
          onSelectSavedProduction={t.handleSelectSavedProduction}
          production={t.displayedProduction}
          onContinue={() => t.setActiveStage('financial')}
        />
      ) : t.activeStage === 'financial' ? (
        <FinancialStage
          idea={t.idea}
          conceptStatement={t.selectedConceptStatement}
          notes={t.financialNotes}
          onNotesChange={t.setFinancialNotes}
          onGenerateFinancial={t.handleGenerateFinancial}
          isLoading={t.isFinancialLoading}
          errorMessage={t.financialError}
          limitedUntil={t.financialLimitedUntil}
          countdown={t.financialCountdown}
          savedFinancials={t.financialHistory}
          savedFinancialsLoading={t.financialHistoryLoading}
          selectedFinancialId={t.selectedFinancialId}
          onSelectSavedFinancial={t.handleSelectSavedFinancial}
          financial={t.displayedFinancial}
        />
      ) : (
        <div className="rounded-xl border bg-white p-10 text-center space-y-2" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
          <Lock className="w-5 h-5 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">{activeLabel} is coming soon.</p>
          <p className="text-xs text-muted-foreground">This stage's AI guidance isn't wired up yet.</p>
        </div>
      )}
    </div>
  )
}

export default EntrepProgressive