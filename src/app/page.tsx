"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useHomePage } from "@/hooks/useHomePage";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { PasteInput } from "@/components/input/PasteInput";
import { TeamReport } from "@/components/report/TeamReport";
import { SlideNavControls } from "@/components/report/SlideNavControls";
import { WalkthroughOverlay } from "@/components/ui/WalkthroughOverlay";
import { ShortcutHintOverlay } from "@/components/ui/ShortcutHintOverlay";
import { ShareViewCTA } from "@/components/ui/ShareViewCTA";
import { SwipeHint } from "@/components/ui/SwipeHint";
import { Navbar } from "@/components/layout/Navbar";
import { ReactionBar } from "@/components/social/ReactionBar";
import { CreatorLink } from "@/components/social/CreatorLink";
import { ViewCount } from "@/components/social/ViewCount";
import { SaveButton } from "@/components/social/SaveButton";
import { ClaimButton } from "@/components/social/ClaimButton";
import { EditChangelog } from "@/components/social/EditChangelog";
import { CollaboratorPanel } from "@/components/social/CollaboratorPanel";
import { getSessionId } from "@/lib/utils/session-id";
import { clearRandomAccent } from "@/lib/utils/random-accent";
import { I18nProvider } from "@/lib/i18n";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";

// Lazy-load heavy modal and social components (only rendered conditionally)
const ShareModal = dynamic(() => import("@/components/ui/ShareModal").then(m => ({ default: m.ShareModal })));
const CommentSection = dynamic(() => import("@/components/social/CommentSection").then(m => ({ default: m.CommentSection })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-xl h-32" />,
});

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
    isOwner,
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
    autoSaveStatus,
    collaborators,
    syncStatus,
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
    spreadNotes,
    setSpreadNote,
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
    tags,
    setTags,
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
    walkthroughPrev,
    walkthroughSkip,
    startWalkthrough,
    walkthroughGuidePokemon,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    pendingTemplateId,
    setPendingTemplateId,
    handleAnalyze,
    isSampleTeam,
    handleReset,
    handleDecodeFailed,
  } = useHomePage();

  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);

  // Swipe navigation for mobile
  const swipeRef = useSwipeNavigation({
    onSwipeLeft: nextSlide,
    onSwipeRight: prevSlide,
    enabled: !!analysis,
  });

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

  // Slide reorder logic — determine if current slide is a reorderable Pokemon or matchup plan
  const pokemonCount = analysis?.pokemon.length ?? 0;
  const plansCount = plans.length;
  const isPokemonSlide = physicalSlide >= 1 && physicalSlide <= pokemonCount;
  const isMatchupPlanSlide = physicalSlide >= pokemonCount + 2 && physicalSlide < pokemonCount + 2 + plansCount;

  const canMoveSlideUp = creatorMode && (
    (isPokemonSlide && physicalSlide > 1) ||
    (isMatchupPlanSlide && physicalSlide > pokemonCount + 2)
  );
  const canMoveSlideDown = creatorMode && (
    (isPokemonSlide && physicalSlide < pokemonCount) ||
    (isMatchupPlanSlide && physicalSlide < pokemonCount + 1 + plansCount)
  );

  const handleMoveSlideUp = useCallback(() => {
    if (isPokemonSlide) {
      const pokemonIdx = physicalSlide - 1;
      reorderPokemon(pokemonIdx, pokemonIdx - 1);
    } else if (isMatchupPlanSlide) {
      const planIdx = physicalSlide - (pokemonCount + 2);
      reorderPlans(planIdx, planIdx - 1);
    }
  }, [isPokemonSlide, isMatchupPlanSlide, physicalSlide, pokemonCount, reorderPokemon, reorderPlans]);

  const handleMoveSlideDown = useCallback(() => {
    if (isPokemonSlide) {
      const pokemonIdx = physicalSlide - 1;
      reorderPokemon(pokemonIdx, pokemonIdx + 1);
    } else if (isMatchupPlanSlide) {
      const planIdx = physicalSlide - (pokemonCount + 2);
      reorderPlans(planIdx, planIdx + 1);
    }
  }, [isPokemonSlide, isMatchupPlanSlide, physicalSlide, pokemonCount, reorderPokemon, reorderPlans]);

  const handleCreateOwn = useCallback(() => {
    handleReset();
    exitSharedView();
    window.location.href = window.location.origin;
  }, [handleReset, exitSharedView]);

  // Fork: keep all report data but start a new local draft
  const handleForkReport = useCallback(() => {
    setCreatorName("");
    exitSharedView();
    setCreatorMode(true);
    // Replace URL to remove share context
    window.history.replaceState(null, "", "/");
  }, [setCreatorName, exitSharedView, setCreatorMode]);

  // Show paste input if no analysis and not loading shared view
  if (!analysis && !sharedState && !isSharePending) {
    return (
      <main className="min-h-screen">
        <PasteInput
          paste={paste}
          onPasteChange={setPaste}
          onAnalyze={handleAnalyze}
          selectedTemplate={pendingTemplateId}
          onTemplateSelect={setPendingTemplateId}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
      </main>
    );
  }

  // Collab link sign-in gate: if ?key= present and user isn't signed in, prompt sign-in
  if (!analysis && isSharePending && editKeyFromUrl && authLoaded && !isSignedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-5 animate-fade-in text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">You&apos;ve been invited to collaborate</h2>
            <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
              Create an account or sign in to edit this team report. Your changes will sync in real time with the owner.
            </p>
          </div>
          <SignUpButton mode="modal">
            <button className="w-full px-6 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-md shadow-accent/25">
              Sign up to collaborate
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="text-sm font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer">
              Already have an account? Sign in
            </button>
          </SignInButton>
          <a href="/" className="text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors mt-1">
            or go to home page
          </a>
        </div>
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
        autoSaveStatus={autoSaveStatus}
        collaborators={collaborators}
        syncStatus={syncStatus}
        isSampleTeam={isSampleTeam}
        shareStatus={shareStatus}
        shareButtonText={shareButtonText}
        lastShareResult={lastShareResult}
        onShareClick={handleShareClick}
        onReshare={handleReshare}
        isOwner={isOwner}
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
        ref={swipeRef}
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
          spreadNotes={spreadNotes}
          onSpreadNoteChange={isReadOnly ? undefined : setSpreadNote}
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
          tags={tags}
          onTagsChange={setTags}
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
        canMoveUp={canMoveSlideUp}
        canMoveDown={canMoveSlideDown}
        onMoveUp={handleMoveSlideUp}
        onMoveDown={handleMoveSlideDown}
      />

      {/* Swipe hint for mobile (one-time) */}
      <SwipeHint />

      {/* Claim button for editors who are signed in */}
      {isSharedView && isEditingUnlocked && activeShareId && editKeyFromUrl && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2">
          <ClaimButton shareId={activeShareId} editToken={editKeyFromUrl} />
        </div>
      )}

      {/* Collaborator management (owner only) + Edit changelog (all editors) */}
      {isSharedView && isEditingUnlocked && activeShareId && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          {isOwner && <CollaboratorPanel shareId={activeShareId} />}
          <EditChangelog shareId={activeShareId} editToken={editKeyFromUrl ?? undefined} />
        </div>
      )}

      {/* Social engagement section for public shared reports */}
      {isSharedView && !isEditingUnlocked && !isPresentationStyle && activeShareId && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6 space-y-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {creatorName && <CreatorLink name={creatorName} />}
            <ViewCount count={viewCount} />
            <SaveButton shareId={activeShareId} />
            <button
              type="button"
              onClick={handleForkReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 bg-surface border-border text-text-secondary hover:border-accent/30 hover:text-accent transition-all cursor-pointer"
              title="Fork this report — copy the full team, notes, calcs, and matchup plans into your own editable draft"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="18" r="3" />
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="6" r="3" />
                <path d="M18 9v1a2 2 0 01-2 2H8a2 2 0 01-2-2V9" />
                <line x1="12" y1="12" x2="12" y2="15" />
              </svg>
              Fork Report
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
          onPrev={walkthroughPrev}
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
