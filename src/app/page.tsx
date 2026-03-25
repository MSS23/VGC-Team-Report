"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { useHomePage } from "@/hooks/useHomePage";
import { PasteInput } from "@/components/input/PasteInput";
import { TeamReport } from "@/components/report/TeamReport";
import { SlideNavControls } from "@/components/report/SlideNavControls";
import { WalkthroughOverlay } from "@/components/ui/WalkthroughOverlay";
import { ShortcutHintOverlay } from "@/components/ui/ShortcutHintOverlay";
import { ShareModal } from "@/components/ui/ShareModal";
import { ShareViewCTA } from "@/components/ui/ShareViewCTA";
import { Navbar } from "@/components/layout/Navbar";
import { ReactionBar } from "@/components/social/ReactionBar";
import { CommentSection } from "@/components/social/CommentSection";
import { CreatorLink } from "@/components/social/CreatorLink";
import { ViewCount } from "@/components/social/ViewCount";
import { SaveButton } from "@/components/social/SaveButton";
import { ClaimButton } from "@/components/social/ClaimButton";
import { getSessionId } from "@/lib/utils/session-id";
import { clearRandomAccent } from "@/lib/utils/random-accent";
import { I18nProvider } from "@/lib/i18n";

export default function Home() {
  return (
    <I18nProvider>
      <Suspense>
        <HomeContent />
      </Suspense>
    </I18nProvider>
  );
}

function HomeContent() {
  const {
    t,
    paste,
    setPaste,
    analysis,
    warnings,
    reorderPokemon,
    creatorMode,
    setCreatorMode,
    presentationMode,
    setPresentationMode,
    darkMode,
    setDarkMode,
    genTheme,
    setGenTheme,
    isReadOnly,
    isPresentationStyle,
    isSharedView,
    isSharePending,
    sharedState,
    shareStatus,
    urlWarning,
    decodeFailed,
    exitSharedView,
    isEditingUnlocked,
    lastShareResult,
    hasExistingShare,
    showEditUrl,
    setShowEditUrl,
    editLinkCopied,
    shareButtonText,
    handleShareClick,
    handleReshare,
    handleCopyEditLink,
    handleFreshReshare,
    isPublic,
    handleSetPublic,
    allowComments,
    setAllowComments,
    activeShareId,
    editKeyFromUrl,
    saveFlash,
    showShortcutHint,
    setShowShortcutHint,
    speciesKeys,
    notes,
    setNote,
    calcs,
    addCalc,
    removeCalc,
    editCalc,
    roles,
    setRole,
    summary,
    setSummary,
    tournamentName,
    setTournamentName,
    placement,
    setPlacement,
    record,
    setRecord,
    mvpIndex,
    setMvpIndex,
    rentalCode,
    setRentalCode,
    creatorName,
    setCreatorName,
    plans,
    addPlan,
    removePlan,
    addGamePlan,
    removeGamePlan,
    updateGamePlanNotes,
    updateGamePlanReplays,
    updateGamePlanBring,
    reorderGamePlanBring,
    updateGamePlanResult,
    reorderPlans,
    getSpriteConfig,
    currentSlide,
    goToSlide,
    nextSlide,
    prevSlide,
    isFirst,
    isLast,
    totalSlides,
    physicalSlide,
    slideLabels,
    slideHiddenStates,
    isSlideHiddenAt,
    handleToggleCurrentSlide,
    walkthroughActive,
    walkthroughStep,
    walkthroughStepIndex,
    walkthroughTotalSteps,
    walkthroughNext,
    walkthroughSkip,
    startWalkthrough,
    walkthroughGuidePokemon,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    handleAnalyze,
    isSampleTeam,
    handleReset,
    handleDecodeFailed,
  } = useHomePage();

  const [showShareModal, setShowShareModal] = useState(false);

  // Clear random accent when viewing a report (use author's default theme)
  useEffect(() => {
    if (analysis) clearRandomAccent();
  }, [analysis]);
  const [viewCount, setViewCount] = useState(0);
  const viewTracked = useRef(false);

  // Track view count for shared public reports (once only)
  useEffect(() => {
    if (!isSharedView || !activeShareId || viewTracked.current) return;
    viewTracked.current = true;
    const sessionId = getSessionId();
    if (!sessionId) return;
    fetch(`/api/views/${activeShareId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.viewCount) setViewCount(data.viewCount); })
      .catch(() => {});
  }, [isSharedView, activeShareId]);

  // Open share modal when a share completes with a public URL
  const prevShareStatus = useRef(shareStatus);
  useEffect(() => {
    if (prevShareStatus.current === "copying" && shareStatus === "copied" && lastShareResult?.publicUrl) {
      setShowShareModal(true);
    }
    prevShareStatus.current = shareStatus;
  }, [shareStatus, lastShareResult]);

  const teamSpecies = analysis?.pokemon.map((p) => p.parsed.species) ?? [];

  const handleCreateOwn = useCallback(() => {
    handleReset();
    exitSharedView();
    window.location.href = window.location.origin;
  }, [handleReset, exitSharedView]);

  // Show paste input if no analysis and not loading shared view
  if (!analysis && !sharedState && !isSharePending) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <PasteInput
          paste={paste}
          onPasteChange={setPaste}
          onAnalyze={handleAnalyze}
        />
      </main>
    );
  }

  // Loading / error state for shared view
  if (!analysis && (sharedState || isSharePending || decodeFailed)) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        {decodeFailed ? (
          <div className="flex flex-col items-center gap-4 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p className="text-text-primary font-semibold">{t.failedToLoadShared}</p>
            <p className="text-text-secondary text-sm max-w-xs">{t.sharedLinkCorrupt}</p>
            <button
              onClick={handleDecodeFailed}
              className="mt-2 px-5 py-2 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 transition-colors"
            >
              {t.buildYourOwn}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-7xl animate-fade-in px-4">
            {/* Skeleton: Tournament info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="skeleton h-7 w-48" />
              <div className="skeleton h-6 w-20" />
              <div className="skeleton h-6 w-16" />
            </div>
            {/* Skeleton: Team summary */}
            <div className="skeleton h-32 w-full mb-8 rounded-xl" />
            {/* Skeleton: Pokemon grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border p-5 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="skeleton w-[76px] h-[76px] rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-5 w-28" />
                      <div className="flex gap-1">
                        <div className="skeleton h-5 w-14 rounded-full" />
                        <div className="skeleton h-5 w-14 rounded-full" />
                      </div>
                      <div className="skeleton h-4 w-36" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="skeleton h-9 rounded-lg" />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="skeleton h-3 w-8" />
                        <div className="skeleton h-2.5 flex-1 rounded-full" />
                        <div className="skeleton h-3 w-8" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-text-tertiary text-sm mt-6">{t.loadingSharedTeam}</p>
          </div>
        )}
      </main>
    );
  }

  // Show report
  return (
    <main className={`bg-background ${isPresentationStyle ? "h-screen overflow-y-auto" : "min-h-screen"}`}>
      <Navbar
        isPresentationStyle={isPresentationStyle}
        isSharedView={isSharedView}
        isEditingUnlocked={isEditingUnlocked}
        creatorMode={creatorMode}
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        slideLabels={slideLabels}
        tournamentName={tournamentName}
        placement={placement}
        record={record}
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        genTheme={genTheme}
        onGenThemeChange={setGenTheme}
        warnings={warnings}
        saveFlash={saveFlash}
        isSampleTeam={isSampleTeam}
        shareStatus={shareStatus}
        shareButtonText={shareButtonText}
        lastShareResult={lastShareResult}
        onShareClick={handleShareClick}
        onReshare={handleReshare}
        hasExistingShare={hasExistingShare()}
        editLinkCopied={editLinkCopied}
        onCopyEditLink={handleCopyEditLink}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onShowShortcuts={setShowShortcutHint}
        onSetCreatorMode={setCreatorMode}
        onSetPresentationMode={setPresentationMode}
        onReset={handleReset}
        onExitSharedView={exitSharedView}
      />

      {/* URL length warning */}
      {urlWarning && (
        <div className="max-w-7xl mx-auto px-4 pt-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-600 dark:text-amber-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{urlWarning}</span>
          </div>
        </div>
      )}

      {/* Report content */}
      <div
        className={`max-w-7xl mx-auto slide-content ${
          isSharedView && !isEditingUnlocked && !isPresentationStyle ? "pb-36 sm:pb-32" : "pb-20 sm:pb-20"
        } ${
          isPresentationStyle
            ? "px-3 sm:px-8 py-2 sm:py-6"
            : "px-2 sm:px-4 py-2 sm:py-6 creator:px-8 creator:py-8"
        }`}
        key={physicalSlide}
        style={{ viewTransitionName: "slide" }}
      >
        {/* Hidden slide banner for creator */}
        {creatorMode && isSlideHiddenAt(physicalSlide) && (
          <div className="flex items-center gap-3 px-4 py-3 mb-5 bg-amber-500/8 border border-amber-500/25 rounded-2xl animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t.thisSlideIsHidden}</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5" dangerouslySetInnerHTML={{ __html: t.hiddenSlideDescription }} />
            </div>
            <button
              type="button"
              onClick={handleToggleCurrentSlide}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors border border-amber-500/20"
            >
              {t.showSlide}
            </button>
          </div>
        )}
        <TeamReport
          analysis={analysis!}
          creatorMode={creatorMode}
          currentSlide={physicalSlide}
          notes={notes}
          onNoteChange={setNote}
          calcs={calcs}
          onAddCalc={addCalc}
          onRemoveCalc={removeCalc}
          onEditCalc={editCalc}
          speciesKeys={speciesKeys}
          roles={roles}
          onRoleChange={setRole}
          teamSummary={summary}
          onTeamSummaryChange={setSummary}
          tournamentName={tournamentName}
          onTournamentNameChange={setTournamentName}
          placement={placement}
          onPlacementChange={setPlacement}
          record={record}
          onRecordChange={setRecord}
          rentalCode={rentalCode}
          onRentalCodeChange={setRentalCode}
          creatorName={creatorName}
          onCreatorNameChange={setCreatorName}
          mvpIndex={mvpIndex}
          onMvpIndexChange={setMvpIndex}
          isReadOnly={isReadOnly}
          isPresentationMode={isPresentationStyle}
          plans={plans}
          onGamePlanNotesChange={updateGamePlanNotes}
          onGamePlanReplaysChange={updateGamePlanReplays}
          onGamePlanBringChange={updateGamePlanBring}
          onReorderGamePlanBring={reorderGamePlanBring}
          onGamePlanResultChange={updateGamePlanResult}
          onReorderPlans={reorderPlans}
          onAddGamePlan={addGamePlan}
          onRemoveGamePlan={removeGamePlan}
          onRemovePlan={removePlan}
          onAddPlan={addPlan}
          getSpriteConfig={getSpriteConfig}
          onReorderPokemon={isReadOnly ? undefined : reorderPokemon}
        />
      </div>

      {/* Slide navigation */}
      <SlideNavControls
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        isFirst={isFirst}
        isLast={isLast}
        onPrev={prevSlide}
        onNext={nextSlide}
        onGoTo={goToSlide}
        slideLabels={slideLabels}
        autoHide={presentationMode}
        hiddenStates={creatorMode ? slideHiddenStates : undefined}
        onToggleHide={creatorMode ? handleToggleCurrentSlide : undefined}
        isCurrentHidden={creatorMode ? isSlideHiddenAt(physicalSlide) : false}
        onShowShortcuts={() => setShowShortcutHint(true)}
        onStartTour={!presentationMode ? startWalkthrough : undefined}
      />

      {/* Claim button for editors who are signed in */}
      {isSharedView && isEditingUnlocked && activeShareId && editKeyFromUrl && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2">
          <ClaimButton shareId={activeShareId} editToken={editKeyFromUrl} />
        </div>
      )}

      {/* Social engagement section for public shared reports */}
      {isSharedView && !isEditingUnlocked && !isPresentationStyle && activeShareId && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            {creatorName && <CreatorLink name={creatorName} />}
            <ViewCount count={viewCount} />
            <SaveButton shareId={activeShareId} />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(paste);
                window.location.href = "/";
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 bg-surface border-border text-text-secondary hover:border-accent/30 hover:text-accent transition-all cursor-pointer"
              title="Copy this team and create your own version"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
              Fork Team
            </button>
          </div>
          <ReactionBar shareId={activeShareId} />
          {allowComments ? (
            <CommentSection shareId={activeShareId} editToken={editKeyFromUrl ?? undefined} />
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 bg-surface-alt/50 border border-border rounded-xl text-xs text-text-tertiary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
              <span>Comments are turned off by the creator.</span>
            </div>
          )}
        </div>
      )}

      {/* Walkthrough overlay */}
      {walkthroughActive && walkthroughStep && (
        <WalkthroughOverlay
          step={walkthroughStep}
          stepIndex={walkthroughStepIndex}
          totalSteps={walkthroughTotalSteps}
          onNext={walkthroughNext}
          onSkip={walkthroughSkip}
          guidePokemon={walkthroughGuidePokemon}
        />
      )}

      {/* Keyboard shortcut hint overlay (presentation mode) */}
      <ShortcutHintOverlay
        visible={showShortcutHint}
        onDismiss={() => setShowShortcutHint(false)}
        isPresentationMode={isPresentationStyle}
      />

      {/* Share modal — social share options */}
      {showShareModal && lastShareResult?.publicUrl && (
        <ShareModal
          publicUrl={lastShareResult.publicUrl}
          teamSpecies={teamSpecies}
          tournamentName={tournamentName}
          creatorName={creatorName}
          placement={placement}
          isPublic={isPublic}
          onTogglePublic={handleSetPublic}
          allowComments={allowComments}
          onToggleComments={(v) => {
            setAllowComments(v);
            handleSetPublic(isPublic); // trigger save to persist allowComments
          }}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* CTA banner for shared views (read-only viewers) */}
      {isSharedView && !isEditingUnlocked && !isPresentationStyle && (
        <ShareViewCTA onCreateOwn={handleCreateOwn} />
      )}

      {/* Edit URL toast — shown after sharing */}
      {showEditUrl && lastShareResult?.editUrl && (
        <div className="fixed bottom-20 sm:bottom-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in max-w-md w-full px-4">
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="text-sm font-bold text-text-primary">{t.publicLinkCopied}</h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  {t.saveEditLink}
                </p>
              </div>
              <button
                onClick={() => setShowEditUrl(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0 cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-surface-alt border border-border-subtle rounded-lg px-3 py-2 text-text-secondary truncate font-mono">
                {lastShareResult.editUrl}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(lastShareResult.editUrl!);
                }}
                className="flex-shrink-0 px-3 py-2 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent/85 transition-colors cursor-pointer"
              >
                {t.copyEditLink}
              </button>
            </div>
            <p className="text-[10px] text-text-tertiary mt-2.5">
              {t.lostEditLink}{" "}
              <button
                onClick={handleFreshReshare}
                className="text-accent hover:underline font-medium cursor-pointer"
              >
                {t.generateNewEditLink}
              </button>
              {" "}{t.oldEditLinkStops}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
